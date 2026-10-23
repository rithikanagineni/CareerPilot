// ============================================================
// CareerPilot — Opportunities API Route
// GET /api/opportunities?role=&location=
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { searchOpportunities } from '@/lib/mcp/tools';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') ?? undefined;
    const location = searchParams.get('location') ?? undefined;
    const skills = searchParams.get('skills')?.split(',').filter(Boolean);
    const experienceLevel = searchParams.get('experienceLevel') as
      | 'student'
      | 'fresher'
      | 'junior'
      | 'mid'
      | undefined;

    const results = searchOpportunities({ role, location, skills, experienceLevel });

    return NextResponse.json({ opportunities: results, count: results.length });
  } catch (error) {
    console.error('[API /opportunities] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
