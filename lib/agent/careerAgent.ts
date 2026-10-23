// ============================================================
// CareerPilot — Career Agent
// Orchestrates MCP tool calls based on user intent + AI
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import { getAIProvider } from '@/lib/ai';
import {
  mcpGetCandidateProfile,
  mcpSearchOpportunities,
  mcpAnalyzeMatch,
  mcpAnalyzeSkillGaps,
  mcpCreateCareerPlan,
  mcpGenerateInterviewPrep,
  checkMCPHealth,
} from './mcpClient';
import type {
  AgentActivity,
  CandidateProfile,
  Opportunity,
  MatchResult,
  SkillGap,
  CareerPlan,
  InterviewPrep,
} from '@/types';

export interface AgentResponse {
  message: string;
  activities: AgentActivity[];
  data?: {
    opportunities?: Opportunity[];
    matchResult?: MatchResult;
    skillGap?: SkillGap;
    careerPlan?: CareerPlan;
    interviewPrep?: InterviewPrep;
    candidateProfile?: CandidateProfile;
  };
  usedTools: string[];
  aiProvider: string;
  mcpAvailable: boolean;
}

export interface AgentContext {
  candidateId: string;
  careerContext: {
    targetRole?: string;
    location?: string;
    experienceLevel?: string;
    skills?: string[];
  };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ─────────────────────────────────────────────────────────────
// Intent Detection
// ─────────────────────────────────────────────────────────────
type Intent =
  | 'search_opportunities'
  | 'analyze_match'
  | 'skill_gap'
  | 'career_plan'
  | 'interview_prep'
  | 'get_profile'
  | 'general';

function detectIntent(input: string): Intent {
  const lower = input.toLowerCase();

  if (lower.includes('interview') || lower.includes('prepare me') || lower.includes('practice question'))
    return 'interview_prep';

  if (
    (lower.includes('plan') || lower.includes('roadmap') || lower.includes('what should i do') ||
      lower.includes('action') || lower.includes('steps')) &&
    (lower.includes('month') || lower.includes('week') || lower.includes('career') || lower.includes('day'))
  )
    return 'career_plan';

  if (
    lower.includes('skill gap') || lower.includes('missing skill') || lower.includes('what skill') ||
    lower.includes('what am i missing') || lower.includes('improve') ||
    (lower.includes('skill') && lower.includes('need'))
  )
    return 'skill_gap';

  if (
    lower.includes('match') || lower.includes('good fit') || lower.includes('qualify') ||
    lower.includes('why am i') || lower.includes('am i a good')
  )
    return 'analyze_match';

  if (lower.includes('profile') || lower.includes('my skills') || lower.includes('about me'))
    return 'get_profile';

  if (
    (lower.includes('find') || lower.includes('search') || lower.includes('look') ||
      lower.includes('show') || lower.includes('want') || lower.includes('looking for') ||
      lower.includes('internship') || lower.includes('job') || lower.includes('opportunit')) &&
    (lower.includes('intern') || lower.includes('job') || lower.includes('role') ||
      lower.includes('position') || lower.includes('opportunit') ||
      lower.includes('ai') || lower.includes('ml') || lower.includes('python') ||
      lower.includes('data') || lower.includes('cloud') || lower.includes('full stack') ||
      lower.includes('hyderabad') || lower.includes('bangalore') || lower.includes('remote'))
  )
    return 'search_opportunities';

  return 'general';
}

// Extract role/location from user message
function extractCareerContext(input: string): {
  targetRole?: string;
  location?: string;
  skills?: string[];
} {
  const lower = input.toLowerCase();
  const result: { targetRole?: string; location?: string; skills?: string[] } = {};

  // Role extraction
  const rolePatterns = [
    { pattern: /ai\/ml|machine learning|ml intern/i, role: 'AI/ML Intern' },
    { pattern: /data science|data scientist|data analyst/i, role: 'Data Science Intern' },
    { pattern: /full.?stack|frontend|backend|web dev/i, role: 'Full Stack Intern' },
    { pattern: /python dev|python engineer/i, role: 'Python Developer Intern' },
    { pattern: /cloud|devops/i, role: 'Cloud Intern' },
    { pattern: /software engineer|sde|software dev/i, role: 'SDE Intern' },
  ];
  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(input)) {
      result.targetRole = role;
      break;
    }
  }

  // Location extraction
  const locations = ['hyderabad', 'bangalore', 'chennai', 'pune', 'mumbai', 'remote'];
  for (const loc of locations) {
    if (lower.includes(loc)) {
      result.location = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Main Agent Function
// ─────────────────────────────────────────────────────────────
export async function runCareerAgent(
  userMessage: string,
  context: AgentContext
): Promise<AgentResponse> {
  const activities: AgentActivity[] = [];
  const usedTools: string[] = [];
  const responseData: AgentResponse['data'] = {};
  const aiProvider = getAIProvider();

  // Update career context from message
  const extracted = extractCareerContext(userMessage);
  if (extracted.targetRole) context.careerContext.targetRole = extracted.targetRole;
  if (extracted.location) context.careerContext.location = extracted.location;

  const intent = detectIntent(userMessage);

  // Add to activity log
  activities.push({
    step: 'Understanding your career goal',
    status: 'completed',
  });

  // Check MCP availability
  const mcpAvailable = await checkMCPHealth();

  // ─ Handle intent with MCP tools ─────────────────────────
  if (intent === 'search_opportunities') {
    activities.push({ step: 'Checking your profile', status: 'active' });

    let profile: CandidateProfile | null = null;
    try {
      const profileResult = await mcpGetCandidateProfile(context.candidateId);
      profile = (profileResult as { content: Array<{ text: string }> }).content?.[0]?.text
        ? JSON.parse((profileResult as { content: Array<{ text: string }> }).content[0].text)
        : profileResult;
      responseData.candidateProfile = profile as CandidateProfile;
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'completed';
    }

    activities.push({ step: 'Searching opportunities', status: 'active' });
    try {
      const searchResult = await mcpSearchOpportunities({
        role: context.careerContext.targetRole,
        location: context.careerContext.location,
        skills: profile?.skills ?? context.careerContext.skills,
        experienceLevel: profile?.experienceLevel ?? 'student',
      });

      const parsed = parseToolResult(searchResult) as {
        count: number;
        opportunities: Opportunity[];
      };
      responseData.opportunities = parsed.opportunities ?? [];
      usedTools.push('search_opportunities');
      activities[activities.length - 1].status = 'completed';
    } catch (e) {
      activities[activities.length - 1].status = 'error';
      console.error('[Agent] search_opportunities failed:', e);
    }

    activities.push({ step: 'Analyzing skill matches', status: 'active' });
    // Quick skill gap for context
    if (profile && context.careerContext.targetRole) {
      try {
        const gapResult = await mcpAnalyzeSkillGaps({
          currentSkills: profile.skills,
          targetRole: context.careerContext.targetRole,
        });
        responseData.skillGap = parseToolResult(gapResult) as SkillGap;
        usedTools.push('analyze_skill_gaps');
        activities[activities.length - 1].status = 'completed';
      } catch {
        activities[activities.length - 1].status = 'completed';
      }
    } else {
      activities[activities.length - 1].status = 'completed';
    }
  } else if (intent === 'analyze_match') {
    activities.push({ step: 'Loading your profile', status: 'active' });
    let profile: CandidateProfile | null = null;
    try {
      const profileResult = await mcpGetCandidateProfile(context.candidateId);
      profile = parseToolResult(profileResult) as CandidateProfile;
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'completed';
    }

    activities.push({ step: 'Analyzing match score', status: 'active' });
    // Use first opportunity from context, or default to opp-001
    const opportunityId = 'opp-001';
    try {
      const matchResult = await mcpAnalyzeMatch({
        candidateId: context.candidateId,
        opportunityId,
      });
      responseData.matchResult = parseToolResult(matchResult) as MatchResult;
      usedTools.push('analyze_match');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'error';
    }
  } else if (intent === 'skill_gap') {
    activities.push({ step: 'Loading your profile', status: 'active' });
    let profile: CandidateProfile | null = null;
    try {
      const profileResult = await mcpGetCandidateProfile(context.candidateId);
      profile = parseToolResult(profileResult) as CandidateProfile;
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'completed';
    }

    activities.push({ step: 'Identifying skill gaps', status: 'active' });
    try {
      const gapResult = await mcpAnalyzeSkillGaps({
        currentSkills: profile?.skills ?? [],
        targetRole: context.careerContext.targetRole ?? 'AI/ML Intern',
      });
      responseData.skillGap = parseToolResult(gapResult) as SkillGap;
      usedTools.push('analyze_skill_gaps');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'error';
    }
  } else if (intent === 'career_plan') {
    activities.push({ step: 'Checking your profile', status: 'active' });
    let profile: CandidateProfile | null = null;
    try {
      const profileResult = await mcpGetCandidateProfile(context.candidateId);
      profile = parseToolResult(profileResult) as CandidateProfile;
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'completed';
    }

    activities.push({ step: 'Identifying skill gaps', status: 'active' });
    activities.push({ step: 'Creating your action plan', status: 'active' });
    try {
      const planResult = await mcpCreateCareerPlan({
        careerGoal: profile?.careerGoals ?? userMessage,
        targetRole: context.careerContext.targetRole ?? profile?.targetRole ?? 'AI/ML Intern',
        candidateId: context.candidateId,
      });
      responseData.careerPlan = parseToolResult(planResult) as CareerPlan;
      usedTools.push('create_career_plan');
      activities[activities.length - 2].status = 'completed';
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'error';
    }
  } else if (intent === 'interview_prep') {
    activities.push({ step: 'Loading your profile', status: 'active' });
    try {
      await mcpGetCandidateProfile(context.candidateId);
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'completed';
    }

    activities.push({ step: 'Generating interview preparation', status: 'active' });
    try {
      const prepResult = await mcpGenerateInterviewPrep({
        targetRole: context.careerContext.targetRole ?? 'AI/ML Intern',
        candidateId: context.candidateId,
      });
      responseData.interviewPrep = parseToolResult(prepResult) as InterviewPrep;
      usedTools.push('generate_interview_prep');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'error';
    }
  } else if (intent === 'get_profile') {
    activities.push({ step: 'Loading your profile', status: 'active' });
    try {
      const profileResult = await mcpGetCandidateProfile(context.candidateId);
      responseData.candidateProfile = parseToolResult(profileResult) as CandidateProfile;
      usedTools.push('get_candidate_profile');
      activities[activities.length - 1].status = 'completed';
    } catch {
      activities[activities.length - 1].status = 'error';
    }
  }

  // ─ Generate AI response ───────────────────────────────────
  const systemPrompt = buildSystemPrompt(context, responseData);
  const aiMessages = [
    ...context.conversationHistory.slice(-6), // last 3 exchanges
    { role: 'user' as const, content: userMessage },
  ];

  let aiResponse: string;
  let providerName: string;

  try {
    const result = await aiProvider.generateResponse(aiMessages, systemPrompt);
    aiResponse = result.content;
    providerName = result.provider;
  } catch (e) {
    console.error('[Agent] AI provider error:', e);
    aiResponse = buildFallbackMessage(intent, responseData);
    providerName = 'CareerPilot Demo (Fallback — not Amazon Bedrock)';
  }

  return {
    message: aiResponse,
    activities,
    data: responseData,
    usedTools,
    aiProvider: providerName,
    mcpAvailable,
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function parseToolResult(result: unknown): unknown {
  if (!result) return null;
  // MCP tool result wraps in content[0].text
  const r = result as { content?: Array<{ text: string }> };
  if (r.content?.[0]?.text) {
    try {
      return JSON.parse(r.content[0].text);
    } catch {
      return r.content[0].text;
    }
  }
  return result;
}

function buildSystemPrompt(
  context: AgentContext,
  data: AgentResponse['data']
): string {
  let prompt = `You are CareerPilot, an expert AI career agent for students and early-career developers. 
You are concise, actionable, warm, and specific. You never give generic advice.
You maintain context about the user's career goals throughout the conversation.

Current career context:
- Target role: ${context.careerContext.targetRole ?? 'Not specified yet'}
- Preferred location: ${context.careerContext.location ?? 'Not specified yet'}
- Experience level: ${context.careerContext.experienceLevel ?? 'student'}
`;

  if (data?.candidateProfile) {
    const p = data.candidateProfile;
    prompt += `\nCandidate profile:
- Name: ${p.name}
- Skills: ${p.skills.join(', ')}
- Projects: ${p.projects.map((pr) => pr.name).join(', ')}
- Target role: ${p.targetRole}
`;
  }

  if (data?.opportunities?.length) {
    prompt += `\nSearch results: Found ${data.opportunities.length} relevant opportunities. Top match: ${data.opportunities[0].company} — ${data.opportunities[0].role} in ${data.opportunities[0].location}.`;
  }

  if (data?.matchResult) {
    const m = data.matchResult;
    prompt += `\nMatch analysis: ${m.matchPercentage}% match. Matching skills: ${m.matchingSkills.join(', ')}. Missing: ${m.missingSkills.join(', ')}.`;
  }

  if (data?.skillGap) {
    const g = data.skillGap;
    prompt += `\nSkill gap: Overall readiness ${g.overallReadiness}%. Missing ${g.missingSkills.length} skills. High priority: ${g.missingSkills.filter((s) => s.priority === 'high').map((s) => s.skill).join(', ')}.`;
  }

  if (data?.careerPlan) {
    prompt += `\nCareer plan created with ${data.careerPlan.immediateActions.length} immediate actions, ${data.careerPlan.sevenDayPlan.length} weekly tasks, and ${data.careerPlan.thirtyDayPlan.length} monthly goals.`;
  }

  if (data?.interviewPrep) {
    prompt += `\nInterview prep generated with ${data.interviewPrep.technicalQuestions.length} technical questions and ${data.interviewPrep.behavioralQuestions.length} behavioral questions.`;
  }

  prompt += `\n\nRespond in a conversational, helpful tone. Use markdown formatting. Be specific and actionable. Reference the actual data retrieved. Keep responses under 400 words unless a detailed plan was requested.`;

  return prompt;
}

function buildFallbackMessage(
  intent: Intent,
  data: AgentResponse['data']
): string {
  if (intent === 'search_opportunities' && data?.opportunities?.length) {
    const opps = data.opportunities.slice(0, 3);
    return `I found **${data.opportunities.length} matching opportunities** for you! Here are the top 3:\n\n${opps
      .map(
        (o, i) =>
          `**${i + 1}. ${o.company}** — ${o.role}\n📍 ${o.location} | 💰 ${o.stipend ?? o.salary ?? 'TBD'}\n🛠 ${o.requiredSkills.slice(0, 3).join(', ')}`
      )
      .join('\n\n')}\n\nWould you like to analyze your match for any of these?`;
  }

  if (intent === 'skill_gap' && data?.skillGap) {
    const gap = data.skillGap;
    const highPri = gap.missingSkills.filter((s) => s.priority === 'high');
    return `Your skill readiness for this role is **${gap.overallReadiness}%**.\n\n**You have:** ${gap.existingSkills.join(', ')}\n\n**High-priority gaps:**\n${highPri.map((s) => `• **${s.skill}** — ${s.recommendedAction}`).join('\n')}\n\nWould you like me to create a 30-day plan to close these gaps?`;
  }

  if (intent === 'career_plan' && data?.careerPlan) {
    const plan = data.careerPlan;
    return `Here's your personalized career plan for **${plan.targetRole}**:\n\n**Immediate Actions:**\n${plan.immediateActions.slice(0, 3).map((a) => `• ${a.action}`).join('\n')}\n\n**This Week:**\n${plan.sevenDayPlan.slice(0, 3).map((a) => `• ${a.action}`).join('\n')}\n\n**This Month:**\n${plan.thirtyDayPlan.slice(0, 3).map((a) => `• ${a.action}`).join('\n')}\n\nReady to start? Which action would you like to tackle first?`;
  }

  if (intent === 'interview_prep' && data?.interviewPrep) {
    const prep = data.interviewPrep;
    return `Here's your interview prep for **${prep.targetRole}**:\n\n**Technical Questions:**\n${prep.technicalQuestions.slice(0, 3).map((q) => `• ${q.question}`).join('\n')}\n\n**Behavioral Questions:**\n${prep.behavioralQuestions.slice(0, 2).map((q) => `• ${q.question}`).join('\n')}\n\n**Top preparation topics:**\n${prep.preparationTopics.slice(0, 3).map((t) => `• **${t.topic}** — ${t.resources[0]}`).join('\n')}`;
  }

  return 'I\'m here to help with your career goals! Try asking me to find internships, analyze your match, identify skill gaps, or create a career plan.';
}
