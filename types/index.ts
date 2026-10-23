// ============================================================
// CareerPilot — Shared TypeScript Types
// ============================================================

export interface CandidateProfile {
  id: string;
  name: string;
  email?: string;
  education: Education[];
  skills: string[];
  projects: Project[];
  experience: Experience[];
  preferredLocations: string[];
  careerGoals: string;
  targetRole: string;
  experienceLevel: 'student' | 'fresher' | 'junior' | 'mid';
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
  cgpa?: number;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Opportunity {
  id: string;
  company: string;
  role: string;
  location: string;
  type: 'internship' | 'full-time' | 'part-time' | 'contract';
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  stipend?: string;
  salary?: string;
  applicationDeadline: string;
  postedDate: string;
  domain: string;
  applyUrl?: string;
}

export interface MatchResult {
  opportunityId: string;
  candidateId: string;
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  relevantProjects: string[];
  strengths: string[];
  concerns: string[];
  explanation: string;
  locationMatch: boolean;
  roleRelevance: number;
}

export interface SkillGap {
  existingSkills: string[];
  missingSkills: SkillGapItem[];
  overallReadiness: number;
}

export interface SkillGapItem {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  recommendedAction: string;
  estimatedTime: string;
}

export interface CareerPlan {
  goal: string;
  targetRole: string;
  immediateActions: PlanItem[];
  sevenDayPlan: PlanItem[];
  thirtyDayPlan: PlanItem[];
  applicationStrategy: string[];
  interviewPreparation: string[];
}

export interface PlanItem {
  id: string;
  action: string;
  category: 'skill' | 'application' | 'project' | 'network' | 'preparation';
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface InterviewPrep {
  targetRole: string;
  technicalQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  projectQuestions: InterviewQuestion[];
  preparationTopics: PreparationTopic[];
}

export interface InterviewQuestion {
  question: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PreparationTopic {
  topic: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
}

// ---- Agent / Chat ----

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
}

export interface AgentActivity {
  step: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface AgentSession {
  sessionId: string;
  candidateId?: string;
  messages: ChatMessage[];
  careerContext?: {
    targetRole?: string;
    location?: string;
    experienceLevel?: string;
    skills?: string[];
  };
}
