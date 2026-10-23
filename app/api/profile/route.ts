// ============================================================
// CareerPilot — Profile API Route
// GET  /api/profile?id=
// POST /api/profile (update, in-memory for demo)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEMO_CANDIDATES } from '@/lib/data/candidates';
import type { CandidateProfile } from '@/types';
import {
  AuthError,
  getUserForSessionToken,
  sessionCookieName,
  updateUserProfile,
} from '@/lib/auth/store';

// In-memory profile store for demo (replaces DB for MVP)
const profileStore = new Map<string, CandidateProfile>(
  DEMO_CANDIDATES.map((c) => [c.id, { ...c }])
);
const privateHeaders = { 'Cache-Control': 'private, no-store' };

const profileUpdateSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  education: z.array(z.object({
    institution: z.string().max(160),
    degree: z.string().max(80),
    field: z.string().max(120),
    year: z.number().int().min(1950).max(2100),
    cgpa: z.number().min(0).max(10).optional(),
  })).max(20).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  projects: z.array(z.object({
    name: z.string().max(120),
    description: z.string().max(1000),
    technologies: z.array(z.string().max(60)).max(30),
    link: z.string().url().optional(),
  })).max(50).optional(),
  experience: z.array(z.object({
    company: z.string().max(160),
    role: z.string().max(120),
    duration: z.string().max(80),
    description: z.string().max(1000),
  })).max(50).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(80)).max(15).optional(),
  careerGoals: z.string().trim().min(10).max(500).optional(),
  targetRole: z.string().trim().min(2).max(100).optional(),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = await getUserForSessionToken(req.cookies.get(sessionCookieName())?.value);
    const id = user?.id ?? searchParams.get('id') ?? 'candidate-001';
    if (user) return NextResponse.json(user.profile, { headers: privateHeaders });
    const profile = profileStore.get(id) ?? DEMO_CANDIDATES.find((candidate) => candidate.id === id);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: privateHeaders });
    }

    return NextResponse.json(profile, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[API /profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = profileUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Profile information is invalid.' },
        { status: 400 },
      );
    }
    const { id: requestedId, ...updates } = parsed.data;
    const user = await getUserForSessionToken(req.cookies.get(sessionCookieName())?.value);
    if (user) {
      const updated = await updateUserProfile(user.id, updates);
      return NextResponse.json(updated);
    }

    const id = requestedId ?? 'candidate-001';

    const existing = profileStore.get(id) ?? DEMO_CANDIDATES.find((candidate) => candidate.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updated: CandidateProfile = { ...existing, ...updates };
    profileStore.set(id, updated);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[API /profile] POST error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
