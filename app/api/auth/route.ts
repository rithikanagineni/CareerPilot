import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AuthError,
  getUserForSessionToken,
  loginUser,
  registerUser,
  revokeSession,
  sessionCookieName,
  sessionCookieOptions,
} from '@/lib/auth/store';

const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  action: z.literal('register'),
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(100),
  targetRole: z.string().trim().min(2).max(100),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid']),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  preferredLocations: z.array(z.string().trim().min(1).max(80)).min(1).max(15),
  careerGoals: z.string().trim().min(10).max(500),
  institution: z.string().trim().min(2).max(160),
  degree: z.string().trim().min(1).max(80),
  field: z.string().trim().min(2).max(120),
  graduationYear: z.number().int().min(1950).max(2100),
});
const privateHeaders = { 'Cache-Control': 'private, no-store' };

function handleAuthError(error: unknown, route: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Please check the information you entered.' },
      { status: 400 },
    );
  }
  console.error(`[API /auth] ${route} error:`, error);
  return NextResponse.json({ error: 'Authentication is temporarily unavailable. Please try again.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserForSessionToken(request.cookies.get(sessionCookieName())?.value);
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401, headers: privateHeaders });
    return NextResponse.json({ user }, { headers: privateHeaders });
  } catch (error) {
    return handleAuthError(error, 'GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || !('action' in body)) {
      return NextResponse.json({ error: 'Choose login or registration.' }, { status: 400 });
    }

    let result: Awaited<ReturnType<typeof loginUser>>;
    if (body.action === 'login') {
      const input = loginSchema.parse(body);
      result = await loginUser(input.email, input.password);
    } else if (body.action === 'register') {
      const input = registerSchema.parse(body);
      result = await registerUser({
        email: input.email,
        password: input.password,
        profile: {
          name: input.name,
          targetRole: input.targetRole,
          experienceLevel: input.experienceLevel,
          skills: [...new Set(input.skills.map((skill) => skill.trim()).filter(Boolean))],
          preferredLocations: [...new Set(input.preferredLocations.map((location) => location.trim()).filter(Boolean))],
          careerGoals: input.careerGoals,
          education: [{
            institution: input.institution,
            degree: input.degree,
            field: input.field,
            year: input.graduationYear,
          }],
        },
      });
    } else {
      return NextResponse.json({ error: 'Unknown authentication action.' }, { status: 400 });
    }

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(sessionCookieName(), result.token, sessionCookieOptions(30 * 24 * 60 * 60));
    return response;
  } catch (error) {
    return handleAuthError(error, 'POST');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(sessionCookieName())?.value;
    await revokeSession(token);
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookieName(), '', { ...sessionCookieOptions(0), expires: new Date(0) });
    return response;
  } catch (error) {
    return handleAuthError(error, 'DELETE');
  }
}
