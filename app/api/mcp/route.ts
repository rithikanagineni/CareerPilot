// ============================================================
// CareerPilot — MCP Proxy API Route
// Allows the frontend to call MCP tools directly via Next.js
// when running in environments where the MCP server port is
// not separately accessible.
// POST /api/mcp  { tool: string, params: object }
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateProfile,
  searchOpportunities,
  analyzeMatch,
  analyzeSkillGaps,
  createCareerPlan,
  generateInterviewPrep,
} from '@/lib/mcp/tools';
import { getCandidateById } from '@/lib/data/candidates';
import { getOpportunityById } from '@/lib/data/opportunities';

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json() as {
      tool: string;
      params: Record<string, unknown>;
    };

    let result: unknown;

    switch (tool) {
      case 'get_candidate_profile': {
        result = getCandidateProfile(params.candidateId as string);
        if (!result) {
          return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }
        break;
      }

      case 'search_opportunities': {
        result = searchOpportunities({
          role: params.role as string | undefined,
          location: params.location as string | undefined,
          skills: params.skills as string[] | undefined,
          experienceLevel: params.experienceLevel as 'student' | 'fresher' | 'junior' | 'mid' | undefined,
        });
        break;
      }

      case 'analyze_match': {
        const candidateProfile = getCandidateById(params.candidateId as string);
        const opportunity = getOpportunityById(params.opportunityId as string);
        if (!candidateProfile || !opportunity) {
          return NextResponse.json({ error: 'Candidate or opportunity not found' }, { status: 404 });
        }
        result = analyzeMatch({ candidateProfile, opportunity });
        break;
      }

      case 'analyze_skill_gaps': {
        result = analyzeSkillGaps({
          currentSkills: params.currentSkills as string[],
          targetRole: params.targetRole as string,
          targetSkills: params.targetSkills as string[] | undefined,
        });
        break;
      }

      case 'create_career_plan': {
        const profile = getCandidateById(params.candidateId as string);
        if (!profile) {
          return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }
        const skillGaps = analyzeSkillGaps({
          currentSkills: profile.skills,
          targetRole: params.targetRole as string,
        });
        result = createCareerPlan({
          careerGoal: params.careerGoal as string,
          targetRole: params.targetRole as string,
          skillGaps,
          preferredTimeline: params.preferredTimeline as string | undefined,
        });
        break;
      }

      case 'generate_interview_prep': {
        const profile = getCandidateById(params.candidateId as string);
        if (!profile) {
          return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }
        const skillGaps = analyzeSkillGaps({
          currentSkills: profile.skills,
          targetRole: params.targetRole as string,
        });
        result = generateInterviewPrep({
          targetRole: params.targetRole as string,
          candidateSkills: profile.skills,
          missingSkills: skillGaps.missingSkills.map((s) => s.skill),
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[API /mcp] Error:', error);
    return NextResponse.json(
      {
        error: 'Career tools are temporarily unavailable.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    server: 'careerpilot-mcp-proxy',
    tools: [
      'get_candidate_profile',
      'search_opportunities',
      'analyze_match',
      'analyze_skill_gaps',
      'create_career_plan',
      'generate_interview_prep',
    ],
    note: 'This is the Next.js API proxy for MCP tools. The primary MCP server runs on port 3001 with Streamable HTTP.',
  });
}
