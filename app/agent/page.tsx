'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import ChatMessageComponent from '@/components/agent/ChatMessage';
import AgentActivityPanel from '@/components/agent/AgentActivityPanel';
import OpportunityCard from '@/components/career/OpportunityCard';
import MatchScoreCard from '@/components/ui/MatchScoreCard';
import SkillGapView from '@/components/career/SkillGapView';
import CareerPlanView from '@/components/career/CareerPlanView';
import type {
  ChatMessage,
  AgentActivity,
  Opportunity,
  MatchResult,
  SkillGap,
  CareerPlan,
  InterviewPrep,
  CandidateProfile,
} from '@/types';
import type { AgentContext, AgentResponse } from '@/lib/agent/careerAgent';

const SUGGESTED_PROMPTS = [
  { icon: '🔍', label: 'Find AI internships in Hyderabad', prompt: 'Find AI internships in Hyderabad' },
  { icon: '📊', label: 'Why am I a good match?', prompt: 'Why am I a good match for this role?' },
  { icon: '🎯', label: 'What skills am I missing?', prompt: 'What skills am I missing for my target role?' },
  { icon: '📋', label: 'Create my 30-day plan', prompt: 'Create my 30-day career action plan' },
  { icon: '🎤', label: 'Prep me for interview', prompt: 'Prepare me for an AI/ML interview' },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm **CareerPilot** — your AI career agent.

I use real MCP tools to search opportunities, analyze your match, identify skill gaps, and build your action plan.

Tell me your career goal to get started:

**"I want an AI/ML internship in Hyderabad"**

Or try one of the suggested prompts below.`,
};

type ResultTab = 'opportunities' | 'match' | 'skills' | 'plan' | 'prep';

export default function AgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [contextLoadError, setContextLoadError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null);
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null);
  const [activeResult, setActiveResult] = useState<ResultTab | null>(null);

  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<unknown>(null);

  const [agentContext, setAgentContext] = useState<AgentContext>({
    candidateId: 'candidate-001',
    careerContext: {},
    conversationHistory: [],
  });

  useEffect(() => {
    let active = true;
    fetch('/api/profile')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load career context');
        return response.json() as Promise<CandidateProfile>;
      })
      .then((profile) => {
        if (active) {
          setCandidateProfile(profile);
          setAgentContext((context) => ({
            ...context,
            candidateId: profile.id,
            careerContext: {
              ...context.careerContext,
              targetRole: profile.targetRole,
              experienceLevel: profile.experienceLevel,
              skills: profile.skills,
            },
          }));
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setContextLoadError(
            loadError instanceof Error ? loadError.message : 'Unable to load career context'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activities]);

  // Auto-resize textarea
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActivities([{ step: 'Understanding your career goal', status: 'active' }]);

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, context: agentContext }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error ?? 'Agent request failed');
        }

        const data = await res.json() as AgentResponse;
        setAiProvider(data.aiProvider);
        setActivities(data.activities);

        if (data.data?.opportunities?.length) {
          setOpportunities(data.data.opportunities);
          setActiveResult('opportunities');
        }
        if (data.data?.matchResult) {
          setMatchResult(data.data.matchResult);
          setActiveResult('match');
        }
        if (data.data?.skillGap) {
          setSkillGap(data.data.skillGap);
          if (!data.data?.matchResult) setActiveResult('skills');
        }
        if (data.data?.careerPlan) {
          setCareerPlan(data.data.careerPlan);
          setActiveResult('plan');
        }
        if (data.data?.interviewPrep) {
          setInterviewPrep(data.data.interviewPrep);
          setActiveResult('prep');
        }

        setAgentContext((prev) => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'user', content: trimmed },
            { role: 'assistant', content: data.message },
          ],
        }));

        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          toolCalls: data.usedTools?.map((t: string) => ({
            toolName: t,
            status: 'completed' as const,
          })),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong.';
        setError(errorMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: 'assistant',
            content: `CareerPilot AI is temporarily unavailable. You can still explore opportunities below.\n\n*Error: ${errorMsg}*`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => setActivities([]), 3000);
        inputRef.current?.focus();
      }
    },
    [isLoading, agentContext]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Voice input is not supported by this browser. You can type your message instead.');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const resultTabs: { key: ResultTab; label: string; icon: string; count?: number }[] = [
    ...(opportunities.length > 0 ? [{ key: 'opportunities' as ResultTab, label: 'Opportunities', icon: '🔍', count: opportunities.length }] : []),
    ...(matchResult ? [{ key: 'match' as ResultTab, label: 'Match Score', icon: '📊' }] : []),
    ...(skillGap ? [{ key: 'skills' as ResultTab, label: 'Skill Gaps', icon: '🎯' }] : []),
    ...(careerPlan ? [{ key: 'plan' as ResultTab, label: 'Career Plan', icon: '📋' }] : []),
    ...(interviewPrep ? [{ key: 'prep' as ResultTab, label: 'Interview Prep', icon: '🎤' }] : []),
  ];

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ background: 'linear-gradient(180deg, #f5f4ff 0%, #f0f5ff 100%)' }}>

      {/* ── Left: Chat panel ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-indigo-100/80">

        {/* Header */}
        <div className="px-5 py-3.5 bg-white/80 backdrop-blur border-b border-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white text-xs font-bold">CP</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">AI Career Agent</h1>
              <p className="text-[10px] text-slate-400 font-medium">
                MCP 2025-11-25 · Streamable HTTP · Session-aware
              </p>
              {aiProvider && (
                <p className="text-[10px] font-medium text-amber-700" aria-live="polite">
                  Response engine: {aiProvider}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-[10px] font-semibold text-emerald-700">MCP Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.prompt}
                  onClick={() => sendMessage(p.prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-100 bg-white text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="px-5 py-4 bg-white/80 backdrop-blur border-t border-indigo-50">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p className="flex-1">{error}</p>
              <button onClick={() => setError(null)} className="flex-shrink-0 text-red-400 hover:text-red-600 font-bold">×</button>
            </div>
          )}
          <div className="flex gap-2.5 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Tell CareerPilot your career goal..."
                className="w-full resize-none rounded-2xl border border-indigo-100 bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 shadow-sm transition-shadow"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                disabled={isLoading}
                aria-label="Message CareerPilot"
              />
              {/* Voice button inside input */}
              <button
                onClick={startVoiceInput}
                disabled={isLoading}
                title="Voice input"
                aria-label="Voice input"
                className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-red-500 bg-red-50 animate-pulse'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {isListening ? (
                  <div className="flex items-end gap-0.5 h-4">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="wave-bar w-0.5 bg-red-500 rounded-full" style={{ height: '60%' }} />
                    ))}
                  </div>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-2xl btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M2 14L14 8 2 2v4l8 2-8 2v4z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Enter to send · Shift+Enter for new line · 🎙 voice input
          </p>
        </div>
      </div>

      {/* ── Center: Career context and live activity ──────────── */}
      <aside className="hidden xl:flex w-[300px] flex-shrink-0 flex-col border-r border-indigo-100/80 bg-white/45 overflow-y-auto">
        <div className="px-4 py-4 border-b border-indigo-100/70">
          <h2 className="font-bold text-slate-900 text-sm">Career Context</h2>
          <p className="text-[10px] text-slate-400 mt-1">Profile data used to personalize your results</p>
        </div>
        <div className="p-4 space-y-4">
          {contextLoadError ? (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
              {contextLoadError}
            </div>
          ) : candidateProfile ? (
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">
                  {candidateProfile.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{candidateProfile.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{candidateProfile.targetRole}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Preferred locations</p>
                  <div className="flex flex-wrap gap-1">
                    {candidateProfile.preferredLocations.map((location) => (
                      <span key={location} className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {candidateProfile.skills.slice(0, 8).map((skill) => (
                      <span key={skill} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Career goal</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{candidateProfile.careerGoals}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 shimmer rounded-2xl" aria-label="Loading candidate profile" />
          )}

          <section aria-live="polite">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Agent Activity</h2>
            {isLoading || activities.length > 0 ? (
              <AgentActivityPanel activities={activities} isLoading={isLoading} />
            ) : (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <span aria-hidden="true">✦</span>
                </div>
                <p className="text-xs font-semibold text-slate-700">No active tool calls</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Submit a goal to see the MCP tools CareerPilot actually runs for your request.
                </p>
              </div>
            )}
          </section>
        </div>
      </aside>

      {/* ── Right: Results panel ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] overflow-hidden">

        {/* Result tabs */}
        {resultTabs.length > 0 && (
          <div className="bg-white/80 backdrop-blur border-b border-indigo-50 px-4 py-3 flex gap-1.5 flex-wrap">
            {resultTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveResult(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeResult === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    activeResult === tab.key ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Result content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeResult === null && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
              {/* Empty state illustration */}
              <Image
                src="/images/career/agent.svg"
                alt="CareerPilot assistant connected to career planning tools"
                width={192}
                height={126}
                className="w-40 h-auto mb-5"
              />
              <h3 className="font-bold text-slate-700 mb-2 text-lg">Results will appear here</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                Ask CareerPilot to find internships, analyze your match, or create a career plan. Results appear as interactive cards.
              </p>
              <div className="w-full space-y-2">
                {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p.prompt}
                    onClick={() => sendMessage(p.prompt)}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-left rounded-xl bg-white border border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-sm text-slate-600 hover:text-indigo-700 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="flex-1">{p.label}</span>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeResult === 'opportunities' && opportunities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Matched Opportunities
                </h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {opportunities.length} found
                </span>
              </div>
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onAnalyzeMatch={() => sendMessage(`Analyze my match for ${opp.role} at ${opp.company}`)}
                  onAskAgent={() => sendMessage(`Tell me more about the ${opp.role} role at ${opp.company}`)}
                />
              ))}
            </div>
          )}

          {activeResult === 'match' && matchResult && <MatchScoreCard match={matchResult} />}
          {activeResult === 'skills' && skillGap && <SkillGapView skillGap={skillGap} targetRole={agentContext.careerContext.targetRole} />}
          {activeResult === 'plan' && careerPlan && <CareerPlanView plan={careerPlan} />}
          {activeResult === 'prep' && interviewPrep && <InterviewPrepView prep={interviewPrep} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Interview Prep panel
// ─────────────────────────────────────────────────────────────
function InterviewPrepView({ prep }: { prep: InterviewPrep }) {
  const [tab, setTab] = useState<'tech' | 'behavioral' | 'project' | 'topics'>('tech');

  const tabs = [
    { key: 'tech' as const, label: 'Technical', count: prep.technicalQuestions.length },
    { key: 'behavioral' as const, label: 'Behavioral', count: prep.behavioralQuestions.length },
    { key: 'project' as const, label: 'Projects', count: prep.projectQuestions.length },
    { key: 'topics' as const, label: 'Topics', count: prep.preparationTopics.length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-indigo-100">
        <h2 className="font-bold text-slate-900">🎤 Interview Preparation</h2>
        <p className="text-sm text-slate-500 mt-0.5">Target: {prep.targetRole}</p>
      </div>
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-semibold transition-colors relative ${tab === t.key ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label} <span className="text-slate-400">({t.count})</span>
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
        {tab === 'tech' && prep.technicalQuestions.map((q, i) => <QuestionCard key={i} q={q} index={i + 1} />)}
        {tab === 'behavioral' && prep.behavioralQuestions.map((q, i) => <QuestionCard key={i} q={q} index={i + 1} />)}
        {tab === 'project' && prep.projectQuestions.map((q, i) => <QuestionCard key={i} q={q} index={i + 1} />)}
        {tab === 'topics' && prep.preparationTopics.map((t, i) => (
          <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-800">{t.topic}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                t.priority === 'high' ? 'bg-red-100 text-red-600' :
                t.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
              }`}>{t.priority}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.resources.map((r) => (
                <span key={r} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ q, index }: { q: { question: string; hint?: string; difficulty: string }; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const diffStyle = q.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
    q.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-indigo-100 transition-colors" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start gap-2">
        <span className="text-slate-400 text-xs font-bold mt-0.5 w-5 flex-shrink-0">{index}.</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 font-medium leading-snug">{q.question}</p>
          {expanded && q.hint && (
            <p className="text-xs text-indigo-600 italic mt-2 p-2 bg-indigo-50 rounded-lg">💡 {q.hint}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${diffStyle}`}>{q.difficulty}</span>
          <span className="text-slate-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
    </div>
  );
}
