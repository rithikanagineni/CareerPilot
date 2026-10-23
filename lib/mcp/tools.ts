// ============================================================
// CareerPilot — MCP Tool Implementations
// Pure logic; called by the MCP server tool handlers
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import type {
  CandidateProfile,
  Opportunity,
  MatchResult,
  SkillGap,
  SkillGapItem,
  CareerPlan,
  PlanItem,
  InterviewPrep,
  InterviewQuestion,
  PreparationTopic,
} from '@/types';
import { DEMO_CANDIDATES, getCandidateById } from '@/lib/data/candidates';
import { OPPORTUNITIES } from '@/lib/data/opportunities';

// ─────────────────────────────────────────────────────────────
// Tool 1 — get_candidate_profile
// ─────────────────────────────────────────────────────────────
export function getCandidateProfile(
  candidateId: string
): CandidateProfile | null {
  const candidate = getCandidateById(candidateId);
  if (!candidate) return null;
  return candidate;
}

// ─────────────────────────────────────────────────────────────
// Tool 2 — search_opportunities
// ─────────────────────────────────────────────────────────────
export interface SearchOpportunitiesInput {
  role?: string;
  location?: string;
  skills?: string[];
  experienceLevel?: string;
}

export function searchOpportunities(
  input: SearchOpportunitiesInput
): Opportunity[] {
  let results = [...OPPORTUNITIES];

  // Filter by role (fuzzy)
  if (input.role) {
    const roleTerms = input.role.toLowerCase().split(/\s+/);
    results = results.filter((opp) => {
      const haystack = `${opp.role} ${opp.domain} ${opp.description}`.toLowerCase();
      return roleTerms.some((term) => haystack.includes(term));
    });
  }

  // Filter by location
  if (input.location && input.location.toLowerCase() !== 'any') {
    results = results.filter(
      (opp) =>
        opp.location.toLowerCase() === input.location!.toLowerCase() ||
        opp.location.toLowerCase() === 'remote'
    );
  }

  // Filter by experience level
  if (input.experienceLevel) {
    results = results.filter(
      (opp) =>
        opp.experienceLevel === input.experienceLevel ||
        (input.experienceLevel === 'student' && opp.type === 'internship')
    );
  }

  // Score by skill overlap
  if (input.skills && input.skills.length > 0) {
    const normalizedSkills = input.skills.map((s) => s.toLowerCase());
    results = results
      .map((opp) => {
        const allRequired = opp.requiredSkills.map((s) => s.toLowerCase());
        const overlap = allRequired.filter((s) =>
          normalizedSkills.some(
            (cs) =>
              s.includes(cs) ||
              cs.includes(s) ||
              levenshteinClose(s, cs, 2)
          )
        ).length;
        return { opp, score: overlap };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ opp }) => opp);
  }

  return results.slice(0, 10); // return top 10
}

// ─────────────────────────────────────────────────────────────
// Tool 3 — analyze_match
// Scoring formula (transparent):
//   skill_score    = matched_required_skills / total_required * 50 pts
//   location_score = location_match ? 20 : 0
//   role_score     = role_relevance_heuristic * 20 pts
//   project_score  = relevant_projects > 0 ? 10 : 0
//   Total max: 100 pts
// ─────────────────────────────────────────────────────────────
export interface AnalyzeMatchInput {
  candidateProfile: CandidateProfile;
  opportunity: Opportunity;
}

export function analyzeMatch(input: AnalyzeMatchInput): MatchResult {
  const { candidateProfile, opportunity } = input;
  const candidateSkillsNorm = candidateProfile.skills.map((s) =>
    s.toLowerCase()
  );
  const requiredSkillsNorm = opportunity.requiredSkills.map((s) =>
    s.toLowerCase()
  );
  const preferredSkillsNorm = opportunity.preferredSkills.map((s) =>
    s.toLowerCase()
  );

  // Skill matching
  const matchingRequired = requiredSkillsNorm.filter((rs) =>
    candidateSkillsNorm.some(
      (cs) => cs.includes(rs) || rs.includes(cs) || levenshteinClose(cs, rs, 2)
    )
  );

  const matchingPreferred = preferredSkillsNorm.filter((ps) =>
    candidateSkillsNorm.some(
      (cs) => cs.includes(ps) || ps.includes(cs) || levenshteinClose(cs, ps, 2)
    )
  );

  const missingRequired = opportunity.requiredSkills.filter(
    (rs) =>
      !candidateSkillsNorm.some((cs) =>
        cs.includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs)
      )
  );

  const missingPreferred = opportunity.preferredSkills.filter(
    (ps) =>
      !candidateSkillsNorm.some((cs) =>
        cs.includes(ps.toLowerCase()) || ps.toLowerCase().includes(cs)
      )
  );

  // Scoring
  const skillScore =
    requiredSkillsNorm.length > 0
      ? (matchingRequired.length / requiredSkillsNorm.length) * 50
      : 25;

  const locationMatch =
    candidateProfile.preferredLocations
      .map((l) => l.toLowerCase())
      .includes(opportunity.location.toLowerCase()) ||
    opportunity.location.toLowerCase() === 'remote';
  const locationScore = locationMatch ? 20 : 5;

  const roleLower = opportunity.role.toLowerCase();
  const targetLower = candidateProfile.targetRole.toLowerCase();
  const roleTerms = targetLower.split(/[\s/]+/);
  const roleRelevance = roleTerms.filter((t) => roleLower.includes(t)).length / Math.max(roleTerms.length, 1);
  const roleScore = roleRelevance * 20;

  const relevantProjects = candidateProfile.projects.filter((p) => {
    const techNorm = p.technologies.map((t) => t.toLowerCase());
    return opportunity.requiredSkills.some((s) =>
      techNorm.some((t) => t.includes(s.toLowerCase()) || s.toLowerCase().includes(t))
    );
  });
  const projectScore = relevantProjects.length > 0 ? 10 : 0;

  const matchPercentage = Math.min(
    Math.round(skillScore + locationScore + roleScore + projectScore),
    100
  );

  // Strengths
  const strengths: string[] = [];
  if (matchingRequired.length > 0)
    strengths.push(`Strong skill alignment: ${matchingRequired.join(', ')}`);
  if (locationMatch)
    strengths.push(`Location preference matches (${opportunity.location})`);
  if (relevantProjects.length > 0)
    strengths.push(
      `Relevant project experience: ${relevantProjects.map((p) => p.name).join(', ')}`
    );
  if (matchingPreferred.length > 0)
    strengths.push(`Bonus preferred skills: ${matchingPreferred.join(', ')}`);

  // Concerns
  const concerns: string[] = [];
  if (missingRequired.length > 0)
    concerns.push(`Missing required skills: ${missingRequired.join(', ')}`);
  if (!locationMatch)
    concerns.push(`Location mismatch (role: ${opportunity.location})`);
  if (matchPercentage < 50)
    concerns.push('Overall skill overlap is below 50% — consider upskilling first.');

  const allMatchingSkills = [
    ...opportunity.requiredSkills.filter((s) =>
      candidateSkillsNorm.some((cs) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs))
    ),
    ...opportunity.preferredSkills.filter((s) =>
      candidateSkillsNorm.some((cs) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs))
    ),
  ];

  const explanation = buildMatchExplanation(
    candidateProfile.name,
    opportunity,
    matchPercentage,
    matchingRequired,
    missingRequired,
    relevantProjects.length
  );

  return {
    opportunityId: opportunity.id,
    candidateId: candidateProfile.id,
    matchPercentage,
    matchingSkills: allMatchingSkills,
    missingSkills: [...missingRequired, ...missingPreferred.slice(0, 3)],
    relevantProjects: relevantProjects.map((p) => p.name),
    strengths,
    concerns,
    explanation,
    locationMatch,
    roleRelevance: Math.round(roleRelevance * 100),
  };
}

function buildMatchExplanation(
  name: string,
  opp: Opportunity,
  score: number,
  matching: string[],
  missing: string[],
  projectCount: number
): string {
  const level = score >= 80 ? 'excellent' : score >= 65 ? 'strong' : score >= 50 ? 'good' : 'partial';
  let text = `${name} is a ${level} match (${score}%) for the ${opp.role} role at ${opp.company}. `;
  if (matching.length > 0) {
    text += `Key matching skills include ${matching.slice(0, 3).join(', ')}. `;
  }
  if (projectCount > 0) {
    text += `Practical project experience adds credibility. `;
  }
  if (missing.length > 0) {
    text += `To improve this match, focus on: ${missing.slice(0, 3).join(', ')}.`;
  }
  return text;
}

// ─────────────────────────────────────────────────────────────
// Tool 4 — analyze_skill_gaps
// ─────────────────────────────────────────────────────────────
export interface AnalyzeSkillGapsInput {
  currentSkills: string[];
  targetRole: string;
  targetSkills?: string[];
}

const ROLE_SKILL_MAP: Record<string, string[]> = {
  'ai/ml intern': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics', 'NumPy', 'Pandas'],
  'machine learning intern': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics'],
  'data science intern': ['Python', 'SQL', 'Statistics', 'Machine Learning', 'Pandas', 'Tableau', 'R'],
  'python developer intern': ['Python', 'Django', 'REST API', 'SQL', 'Docker', 'Git'],
  'full stack intern': ['JavaScript', 'React', 'Node.js', 'SQL', 'TypeScript', 'Docker', 'Git'],
  'sde intern': ['Java', 'Data Structures', 'Algorithms', 'System Design', 'SQL', 'Git'],
  'cloud intern': ['AWS', 'Docker', 'Linux', 'Python', 'Terraform', 'Kubernetes'],
  'backend intern': ['Java', 'Spring Boot', 'SQL', 'REST API', 'Docker', 'Git'],
  'frontend intern': ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Git'],
};

function getTargetSkillsForRole(role: string): string[] {
  const roleLower = role.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (roleLower.includes(key) || key.includes(roleLower)) {
      return skills;
    }
  }
  // Fallback: derive from common engineering skills
  return ['Python', 'Java', 'SQL', 'Data Structures', 'Algorithms', 'Git', 'REST API'];
}

const SKILL_RESOURCES: Record<string, string> = {
  'machine learning': 'Coursera ML Specialization (Andrew Ng)',
  tensorflow: 'TensorFlow official tutorials + DeepLearning.AI',
  pytorch: 'PyTorch tutorials (pytorch.org)',
  docker: 'Docker official docs + "Docker & Kubernetes" Udemy course',
  kubernetes: 'KubeAcademy.io + CKAD certification prep',
  aws: 'AWS Skill Builder (free) + Cloud Practitioner certification',
  react: 'React official docs + Scrimba React course',
  'node.js': 'The Odin Project + official Node.js docs',
  sql: 'SQLZoo.net + Mode Analytics SQL tutorial',
  terraform: 'HashiCorp Learn platform',
  nlp: 'Hugging Face course (free at huggingface.co/learn)',
  statistics: 'Khan Academy Statistics + "Statistics for Data Science" Coursera',
};

export function analyzeSkillGaps(input: AnalyzeSkillGapsInput): SkillGap {
  const currentNorm = input.currentSkills.map((s) => s.toLowerCase());
  const target = input.targetSkills?.length
    ? input.targetSkills
    : getTargetSkillsForRole(input.targetRole);

  const missing: SkillGapItem[] = [];
  const existing: string[] = [];

  for (const skill of target) {
    const skillLower = skill.toLowerCase();
    const hasSkill = currentNorm.some(
      (cs) => cs.includes(skillLower) || skillLower.includes(cs) || levenshteinClose(cs, skillLower, 2)
    );

    if (hasSkill) {
      existing.push(skill);
    } else {
      const priority: 'high' | 'medium' | 'low' =
        target.indexOf(skill) < 3 ? 'high' : target.indexOf(skill) < 6 ? 'medium' : 'low';

      const resourceKey = Object.keys(SKILL_RESOURCES).find(
        (k) => skillLower.includes(k) || k.includes(skillLower)
      );

      missing.push({
        skill,
        priority,
        reason: `${skill} is ${priority === 'high' ? 'a core requirement' : 'commonly expected'} for ${input.targetRole} roles.`,
        recommendedAction: resourceKey
          ? `Learn via: ${SKILL_RESOURCES[resourceKey]}`
          : `Search for "${skill} for beginners" on Coursera or YouTube.`,
        estimatedTime:
          priority === 'high' ? '2–4 weeks' : priority === 'medium' ? '1–2 weeks' : '3–5 days',
      });
    }
  }

  const overallReadiness = target.length > 0
    ? Math.round((existing.length / target.length) * 100)
    : 100;

  return {
    existingSkills: existing,
    missingSkills: missing,
    overallReadiness,
  };
}

// ─────────────────────────────────────────────────────────────
// Tool 5 — create_career_plan
// ─────────────────────────────────────────────────────────────
export interface CreateCareerPlanInput {
  careerGoal: string;
  targetRole: string;
  skillGaps: SkillGap;
  preferredTimeline?: string;
}

export function createCareerPlan(input: CreateCareerPlanInput): CareerPlan {
  const highPriority = input.skillGaps.missingSkills
    .filter((s) => s.priority === 'high')
    .slice(0, 3);
  const mediumPriority = input.skillGaps.missingSkills
    .filter((s) => s.priority === 'medium')
    .slice(0, 2);

  const immediateActions: PlanItem[] = [
    {
      id: uuidv4(),
      action: 'Review the top 3 matched opportunities and shortlist best fits',
      category: 'application',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: 'Update your resume to highlight relevant projects and skills',
      category: 'application',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: `Research target companies for ${input.targetRole} roles`,
      category: 'preparation',
      priority: 'high',
    },
  ];

  if (highPriority.length > 0) {
    immediateActions.push({
      id: uuidv4(),
      action: `Start learning: ${highPriority[0].skill} — ${highPriority[0].recommendedAction}`,
      category: 'skill',
      priority: 'high',
    });
  }

  const sevenDayPlan: PlanItem[] = [
    {
      id: uuidv4(),
      action: 'Complete one online module for your highest-priority skill gap',
      category: 'skill',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: 'Practice 15 DSA problems on LeetCode (easy/medium)',
      category: 'preparation',
      priority: 'medium',
    },
    {
      id: uuidv4(),
      action: 'Apply to your top 3 shortlisted opportunities',
      category: 'application',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: 'Build a small project demonstrating a missing skill',
      category: 'project',
      priority: 'medium',
    },
    {
      id: uuidv4(),
      action: 'Connect with 3 professionals in your target domain on LinkedIn',
      category: 'network',
      priority: 'low',
    },
  ];

  if (mediumPriority.length > 0) {
    sevenDayPlan.push({
      id: uuidv4(),
      action: `Start learning: ${mediumPriority[0].skill} — ${mediumPriority[0].recommendedAction}`,
      category: 'skill',
      priority: 'medium',
    });
  }

  const thirtyDayPlan: PlanItem[] = [
    {
      id: uuidv4(),
      action: 'Apply to 10+ relevant internships/jobs across matched platforms',
      category: 'application',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: `Complete a certification or course in your skill gaps`,
      category: 'skill',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: 'Complete 2 mock technical interviews',
      category: 'preparation',
      priority: 'high',
    },
    {
      id: uuidv4(),
      action: 'Publish a project to GitHub with a clear README',
      category: 'project',
      priority: 'medium',
    },
    {
      id: uuidv4(),
      action: 'Attend a tech event, hackathon, or meetup in your city',
      category: 'network',
      priority: 'low',
    },
    {
      id: uuidv4(),
      action: 'Review and update LinkedIn profile with latest skills and projects',
      category: 'application',
      priority: 'medium',
    },
  ];

  const applicationStrategy = [
    'Tailor your resume for each application — highlight relevant keywords from the JD.',
    'Apply early — many companies fill spots within 2 weeks of posting.',
    'Follow up with an email 1 week after applying if no response.',
    'Use LinkedIn, company career pages, Internshala, and LinkedIn Jobs simultaneously.',
    'Prepare 2–3 STAR-format stories for behavioral questions.',
  ];

  const interviewPreparation = [
    `Practice ${input.targetRole}-specific technical questions daily.`,
    'Prepare to explain all projects in the STAR format.',
    'Review computer science fundamentals: DSA, OS, DBMS.',
    'Mock interviews: Pramp, Interviewing.io, or with peers.',
    'Prepare questions to ask the interviewer — shows genuine interest.',
  ];

  return {
    goal: input.careerGoal,
    targetRole: input.targetRole,
    immediateActions,
    sevenDayPlan,
    thirtyDayPlan,
    applicationStrategy,
    interviewPreparation,
  };
}

// ─────────────────────────────────────────────────────────────
// Tool 6 — generate_interview_prep
// ─────────────────────────────────────────────────────────────
export interface GenerateInterviewPrepInput {
  targetRole: string;
  candidateSkills: string[];
  missingSkills: string[];
}

const TECH_QUESTIONS: Record<string, InterviewQuestion[]> = {
  'ai/ml': [
    { question: 'Explain the bias-variance tradeoff.', hint: 'Discuss underfitting and overfitting.', difficulty: 'medium' },
    { question: 'What is the difference between supervised and unsupervised learning?', hint: 'Give examples of algorithms for each.', difficulty: 'easy' },
    { question: 'How does gradient descent work? What are its variants?', hint: 'SGD, Adam, RMSprop.', difficulty: 'medium' },
    { question: 'Explain regularization techniques and when to use them.', hint: 'L1 vs L2 vs Dropout.', difficulty: 'medium' },
    { question: 'How would you handle class imbalance in a classification problem?', hint: 'SMOTE, class weights, undersampling.', difficulty: 'medium' },
    { question: 'Describe the architecture of a Transformer model.', hint: 'Self-attention, positional encoding, encoder-decoder.', difficulty: 'hard' },
    { question: 'How do you evaluate an ML model beyond accuracy?', hint: 'Precision, recall, F1, ROC-AUC, confusion matrix.', difficulty: 'medium' },
  ],
  python: [
    { question: 'What are Python decorators and how do you create one?', hint: 'Wrap a function to extend its behavior.', difficulty: 'medium' },
    { question: 'Explain Python GIL and its impact on concurrency.', hint: 'Threads vs processes.', difficulty: 'hard' },
    { question: 'What are list comprehensions and when should you avoid them?', hint: 'Readability vs performance.', difficulty: 'easy' },
    { question: 'How do context managers work (`with` statement)?', hint: '__enter__ and __exit__ methods.', difficulty: 'medium' },
  ],
  java: [
    { question: 'Explain OOP principles with Java examples.', hint: 'Encapsulation, inheritance, polymorphism, abstraction.', difficulty: 'easy' },
    { question: 'What is the difference between HashMap and ConcurrentHashMap?', hint: 'Thread safety, locking mechanisms.', difficulty: 'medium' },
    { question: 'Explain Java memory model: stack vs heap.', hint: 'Object allocation, GC.', difficulty: 'medium' },
  ],
  fullstack: [
    { question: 'How does React reconciliation work?', hint: 'Virtual DOM, diffing algorithm, keys.', difficulty: 'medium' },
    { question: 'What is the event loop in Node.js?', hint: 'Non-blocking I/O, call stack, task queue.', difficulty: 'medium' },
    { question: 'Explain REST vs GraphQL — when would you choose each?', hint: 'Over-fetching, under-fetching, flexibility.', difficulty: 'medium' },
  ],
  general: [
    { question: 'Explain time and space complexity with examples.', hint: 'Big O notation, O(n), O(log n).', difficulty: 'easy' },
    { question: 'What is the difference between BFS and DFS?', hint: 'Queue vs stack, use cases.', difficulty: 'easy' },
    { question: 'Design a URL shortener. Walk through the architecture.', hint: 'Hashing, DB, scale.', difficulty: 'hard' },
    { question: 'How do databases handle ACID transactions?', hint: 'Atomicity, Consistency, Isolation, Durability.', difficulty: 'medium' },
  ],
};

const BEHAVIORAL_QUESTIONS: InterviewQuestion[] = [
  { question: 'Tell me about a challenging project you worked on. What was your biggest obstacle?', difficulty: 'medium' },
  { question: 'Describe a situation where you had to learn something quickly. How did you approach it?', difficulty: 'easy' },
  { question: 'Have you worked in a team where things went wrong? How did you handle it?', difficulty: 'medium' },
  { question: 'Why do you want to work at this company?', hint: 'Research the company values and products.', difficulty: 'easy' },
  { question: "Where do you see yourself in 3 years?", difficulty: 'easy' },
  { question: 'Tell me about a time you received constructive feedback. How did you respond?', difficulty: 'medium' },
];

export function generateInterviewPrep(
  input: GenerateInterviewPrepInput
): InterviewPrep {
  const roleLower = input.targetRole.toLowerCase();

  // Pick relevant tech questions
  let techQuestions: InterviewQuestion[] = [...TECH_QUESTIONS.general];
  if (roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('machine learning') || roleLower.includes('data')) {
    techQuestions = [...TECH_QUESTIONS['ai/ml'], ...TECH_QUESTIONS.general];
  } else if (roleLower.includes('full stack') || roleLower.includes('frontend') || roleLower.includes('backend')) {
    techQuestions = [...TECH_QUESTIONS.fullstack, ...TECH_QUESTIONS.general];
  } else if (roleLower.includes('java') || roleLower.includes('sde') || roleLower.includes('software')) {
    techQuestions = [...TECH_QUESTIONS.java, ...TECH_QUESTIONS.general];
  }
  if (input.candidateSkills.some((s) => s.toLowerCase().includes('python'))) {
    techQuestions = [...TECH_QUESTIONS.python, ...techQuestions];
  }
  techQuestions = techQuestions.slice(0, 8);

  // Project questions
  const projectQuestions: InterviewQuestion[] = [
    { question: 'Walk me through your most complex project from start to finish.', difficulty: 'medium' },
    { question: 'What technical decisions did you make in your projects and why?', difficulty: 'medium' },
    { question: 'How would you improve your most recent project if you had more time?', difficulty: 'medium' },
    { question: 'How did you handle challenges or bugs in your project?', difficulty: 'easy' },
  ];

  // Preparation topics
  const prepTopics: PreparationTopic[] = [
    {
      topic: 'Data Structures & Algorithms',
      priority: 'high',
      resources: ['LeetCode', 'NeetCode.io', 'GeeksForGeeks'],
    },
    {
      topic: `${input.targetRole} — domain fundamentals`,
      priority: 'high',
      resources: ['YouTube (search role + tutorial)', 'Coursera', 'Official docs'],
    },
    {
      topic: 'System Design Basics',
      priority: 'medium',
      resources: ['Grokking the System Design Interview', 'ByteByteGo'],
    },
    {
      topic: 'CS Fundamentals (OS, DBMS, Networks)',
      priority: 'medium',
      resources: ['InterviewBit', 'GeeksForGeeks'],
    },
  ];

  // Add topics for missing skills
  for (const ms of input.missingSkills.slice(0, 3)) {
    prepTopics.push({
      topic: `Improve: ${ms}`,
      priority: 'high',
      resources: [`Search "${ms} crash course" on YouTube`, 'Udemy', 'Official documentation'],
    });
  }

  return {
    targetRole: input.targetRole,
    technicalQuestions: techQuestions,
    behavioralQuestions: BEHAVIORAL_QUESTIONS,
    projectQuestions,
    preparationTopics: prepTopics,
  };
}

// ─────────────────────────────────────────────────────────────
// Utility — simple Levenshtein distance check
// ─────────────────────────────────────────────────────────────
function levenshteinClose(a: string, b: string, threshold: number): boolean {
  if (Math.abs(a.length - b.length) > threshold) return false;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length] <= threshold;
}
