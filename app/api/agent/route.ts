// ============================================================
// CareerPilot — Agent API Route
// POST /api/agent
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { runCareerAgent } from '@/lib/agent/careerAgent';
import type { AgentContext } from '@/lib/agent/careerAgent';
import { getUserForSessionToken, sessionCookieName } from '@/lib/auth/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context } = body as {
      message: string;
      context: AgentContext;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!context?.candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required in context' },
        { status: 400 }
      );
    }

    const user = await getUserForSessionToken(req.cookies.get(sessionCookieName())?.value);
    const effectiveContext: AgentContext = user
      ? {
          ...context,
          candidateId: user.id,
          careerContext: {
            ...context.careerContext,
            targetRole: user.profile.targetRole,
            experienceLevel: user.profile.experienceLevel,
            skills: user.profile.skills,
          },
        }
      : context;
    const response = await runCareerAgent(message, effectiveContext);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /agent] Error:', error);
    return NextResponse.json(
      {
        error: 'CareerPilot AI is temporarily unavailable. You can still explore opportunities and your saved career plan.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
