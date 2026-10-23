import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import type { CandidateProfile } from '@/types';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE_NAME = 'careerpilot_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;

interface StoredUser {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  profile: CandidateProfile;
  createdAt: number;
}

interface StoredSession {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

interface AuthDatabase {
  users: StoredUser[];
  sessions: StoredSession[];
}

export interface AuthUser {
  id: string;
  email: string;
  profile: CandidateProfile;
}

export interface RegisterInput {
  email: string;
  password: string;
  profile: Omit<CandidateProfile, 'id' | 'email' | 'projects' | 'experience'>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function databasePath(): string {
  return path.join(process.cwd(), '.careerpilot-auth.json');
}

export function getRegisteredProfileById(userId: string): CandidateProfile | undefined {
  try {
    const database = JSON.parse(readFileSync(databasePath(), 'utf8')) as AuthDatabase;
    return database.users.find((user) => user.id === userId)?.profile;
  } catch (error) {
    if (isFileNotFound(error)) return undefined;
    throw error;
  }
}

async function readDatabase(): Promise<AuthDatabase> {
  try {
    const content = await readFile(databasePath(), 'utf8');
    const database: unknown = JSON.parse(content);
    if (
      typeof database !== 'object' ||
      database === null ||
      !('users' in database) ||
      !Array.isArray(database.users) ||
      !('sessions' in database) ||
      !Array.isArray(database.sessions)
    ) {
      throw new Error('Authentication database has an invalid format.');
    }
    return database as AuthDatabase;
  } catch (error) {
    if (isFileNotFound(error)) return { users: [], sessions: [] };
    throw error;
  }
}

function isFileNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

let writeQueue: Promise<void> = Promise.resolve();

async function updateDatabase<T>(update: (database: AuthDatabase) => T | Promise<T>): Promise<T> {
  let result!: T;
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    result = await update(database);
    const filePath = databasePath();
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(temporaryPath, JSON.stringify(database), { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryPath, filePath);
  });

  writeQueue = operation.then(() => undefined, () => undefined);
  await operation;
  return result;
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    profile: user.profile,
  };
}

async function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return await scrypt(password, salt, PASSWORD_KEY_LENGTH) as Buffer;
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
  const email = input.email.trim().toLowerCase();
  const salt = randomBytes(16);
  const passwordHash = await hashPassword(input.password, salt);
  const userId = `candidate-${randomUUID()}`;
  const profile: CandidateProfile = {
    ...input.profile,
    id: userId,
    email,
    projects: [],
    experience: [],
  };
  const token = randomBytes(32).toString('base64url');

  const user = await updateDatabase((database) => {
    if (database.users.some((storedUser) => storedUser.email === email)) {
      throw new AuthError('An account with this email already exists.', 409);
    }

    const createdUser: StoredUser = {
      id: userId,
      email,
      passwordSalt: salt.toString('hex'),
      passwordHash: passwordHash.toString('hex'),
      profile,
      createdAt: Date.now(),
    };
    database.users.push(createdUser);
    database.sessions = database.sessions.filter((session) => session.expiresAt > Date.now());
    database.sessions.push({
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return toAuthUser(createdUser);
  });

  return { user, token };
}

export async function loginUser(emailInput: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const email = emailInput.trim().toLowerCase();
  const database = await readDatabase();
  const user = database.users.find((record) => record.email === email);

  if (!user) throw new AuthError('Email or password is incorrect.', 401);

  const expectedHash = Buffer.from(user.passwordHash, 'hex');
  const suppliedHash = await hashPassword(password, Buffer.from(user.passwordSalt, 'hex'));
  if (expectedHash.length !== suppliedHash.length || !timingSafeEqual(expectedHash, suppliedHash)) {
    throw new AuthError('Email or password is incorrect.', 401);
  }

  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  await updateDatabase((currentDatabase) => {
    currentDatabase.sessions = currentDatabase.sessions.filter((session) => session.expiresAt > now);
    currentDatabase.sessions.push({
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt: now + SESSION_DURATION_MS,
    });
  });

  return { user: toAuthUser(user), token };
}

export async function getUserForSessionToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const database = await readDatabase();
  const session = database.sessions.find(
    (storedSession) => storedSession.tokenHash === tokenHash && storedSession.expiresAt > Date.now(),
  );
  if (!session) return null;
  const user = database.users.find((record) => record.id === session.userId);
  return user ? toAuthUser(user) : null;
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await updateDatabase((database) => {
    database.sessions = database.sessions.filter((session) => session.tokenHash !== tokenHash);
  });
}

export async function updateUserProfile(userId: string, updates: Partial<CandidateProfile>): Promise<CandidateProfile> {
  return await updateDatabase((database) => {
    const user = database.users.find((record) => record.id === userId);
    if (!user) throw new AuthError('Account not found.', 404);
    user.profile = {
      ...user.profile,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.education !== undefined && { education: updates.education }),
      ...(updates.skills !== undefined && { skills: updates.skills }),
      ...(updates.projects !== undefined && { projects: updates.projects }),
      ...(updates.experience !== undefined && { experience: updates.experience }),
      ...(updates.preferredLocations !== undefined && { preferredLocations: updates.preferredLocations }),
      ...(updates.careerGoals !== undefined && { careerGoals: updates.careerGoals }),
      ...(updates.targetRole !== undefined && { targetRole: updates.targetRole }),
      ...(updates.experienceLevel !== undefined && { experienceLevel: updates.experienceLevel }),
      id: user.id,
      email: user.email,
    };
    return user.profile;
  });
}
