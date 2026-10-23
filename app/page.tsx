import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CareerPilot — Turn career goals into your next best action',
  description: 'AI-powered career agent. Find matching opportunities, analyze your fit, close skill gaps, and create a personalized action plan — in one conversation.',
};

const features = [
  {
    illustration: 'matching.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <circle cx="16" cy="16" r="14" fill="url(#f1g)" opacity="0.15"/>
        <circle cx="16" cy="12" r="5" stroke="#4F46FF" strokeWidth="2"/>
        <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#4F46FF" strokeWidth="2" strokeLinecap="round"/>
        <path d="M23 10l3 2-3 2" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <defs><linearGradient id="f1g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F46FF"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
      </svg>
    ),
    title: 'Smart Matching',
    description: 'Transparent 100-point scoring: skills (50pts), location (20pts), role relevance (20pts), projects (10pts). No black-box rankings.',
    color: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-100',
    badge: 'AI-Powered',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    illustration: 'skills.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <path d="M6 26L6 18" stroke="#4F46FF" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 26L12 12" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M18 26L18 16" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 26L24 8" stroke="#4F46FF" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M4 22L28 22" stroke="#94A3B8" strokeWidth="1" opacity="0.4"/>
        <circle cx="24" cy="8" r="3" fill="#F59E0B"/>
        <path d="M22 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Skill Gap Analysis',
    description: 'Know exactly which skills are missing, their priority, and the fastest way to learn them — with time estimates and resources.',
    color: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
    badge: 'Personalized',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    illustration: 'roadmap.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <rect x="5" y="8" width="22" height="16" rx="4" stroke="#4F46FF" strokeWidth="1.5"/>
        <path d="M10 13h12M10 17h8" stroke="#4F46FF" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="26" cy="8" r="5" fill="#10B981"/>
        <path d="M24 8l1.5 1.5L28 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Career Action Plan',
    description: 'Today, 7-day, and 30-day plans with prioritized tasks. Checkboxes, progress tracking, and application strategy included.',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
    badge: 'Actionable',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    illustration: 'interview.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <circle cx="16" cy="16" r="11" stroke="#4F46FF" strokeWidth="1.5"/>
        <path d="M13 12c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2-3 2.5-3 5" stroke="#4F46FF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="22" r="1.5" fill="#4F46FF"/>
      </svg>
    ),
    title: 'Interview Preparation',
    description: 'Role-specific technical, behavioral, and project questions. Difficulty levels, hints, and preparation topics tailored to your gaps.',
    color: 'from-amber-50 to-yellow-50',
    border: 'border-amber-100',
    badge: 'Role-Specific',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    illustration: 'opportunities.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <path d="M4 24L10 18L14 22L20 14L28 8" stroke="#4F46FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="8" r="3" fill="#4F46FF"/>
        <path d="M4 28h24" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Real Opportunities',
    description: '22+ internships and full-time roles across AI/ML, Data Science, Full Stack, Cloud, and more. Updated demo dataset covering top companies.',
    color: 'from-cyan-50 to-sky-50',
    border: 'border-cyan-100',
    badge: '22+ Roles',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    illustration: 'agent.svg',
    icon: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
        <rect x="6" y="6" width="20" height="20" rx="5" stroke="#4F46FF" strokeWidth="1.5"/>
        <path d="M10 16l4 4 8-8" stroke="#4F46FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="26" cy="6" r="5" fill="url(#f6g)"/>
        <text x="26" y="9.5" fontSize="7" textAnchor="middle" fill="white" fontWeight="700" fontFamily="system-ui">MCP</text>
        <defs><linearGradient id="f6g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F46FF"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
      </svg>
    ),
    title: 'MCP-Powered Agent',
    description: 'Built on MCP 2025-11-25 with Streamable HTTP. 6 real tools, proper session management. The agent calls tools — it doesn\'t fake it.',
    color: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-100',
    badge: 'MCP 2025-11-25',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
];

const steps = [
  {
    num: '01',
    title: 'Set Your Goal',
    desc: 'Tell CareerPilot your target role and location in plain language.',
    icon: '🎯',
    color: 'from-indigo-500 to-violet-500',
    examples: ['Target role', 'Preferred location'],
  },
  {
    num: '02',
    title: 'Understand Your Profile',
    desc: 'CareerPilot uses your skills, education, projects, and goals as career context.',
    icon: '🔍',
    color: 'from-violet-500 to-purple-500',
    examples: ['Skills', 'Education & projects'],
  },
  {
    num: '03',
    title: 'Find Opportunities',
    desc: 'Search roles that fit your target role, location, and current profile.',
    icon: '📊',
    color: 'from-cyan-500 to-blue-500',
    examples: ['Relevant roles', 'Location-aware'],
  },
  {
    num: '04',
    title: 'Analyze Your Match',
    desc: 'See the strengths behind each recommendation and where your fit can improve.',
    icon: '🧭',
    color: 'from-blue-500 to-cyan-500',
    examples: ['Transparent scoring', 'Explainable strengths'],
  },
  {
    num: '05',
    title: 'Close Skill Gaps',
    desc: 'Get prioritized skill recommendations connected to your target opportunities.',
    icon: '📚',
    color: 'from-purple-500 to-fuchsia-500',
    examples: ['Priority gaps', 'Learning actions'],
  },
  {
    num: '06',
    title: 'Take Your Next Action',
    desc: 'Turn the analysis into a personalized plan and interview preparation.',
    icon: '🚀',
    color: 'from-emerald-500 to-teal-500',
    examples: ['Career plan', 'Interview prep'],
  },
];

const workflowPreview = [
  { step: 'Read candidate context', tool: 'get_candidate_profile' },
  { step: 'Search relevant roles', tool: 'search_opportunities' },
  { step: 'Analyze candidate fit', tool: 'analyze_match' },
  { step: 'Identify priority gaps', tool: 'analyze_skill_gaps' },
];

const mcpTools = [
  { name: 'get_candidate_profile', icon: '👤', desc: 'Retrieve profile' },
  { name: 'search_opportunities', icon: '🔍', desc: 'Find 22+ roles' },
  { name: 'analyze_match', icon: '📊', desc: 'Score fit %' },
  { name: 'analyze_skill_gaps', icon: '🎯', desc: 'Find gaps' },
  { name: 'create_career_plan', icon: '📋', desc: 'Build plan' },
  { name: 'generate_interview_prep', icon: '🎤', desc: 'Prep questions' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #f0efff 0%, #f5f0ff 40%, #ecf9ff 100%)' }}>
        {/* Background elements */}
        <div className="absolute inset-0 line-grid opacity-60" />
        <div className="bg-blob-1" style={{ top: '-100px', left: '-100px' }} />
        <div className="bg-blob-2" style={{ bottom: '-80px', right: '100px' }} />
        <div className="bg-blob-3" style={{ top: '100px', right: '-80px' }} />

        {/* Sparkles */}
        <div className="absolute top-24 left-[12%] w-2 h-2 rounded-full bg-indigo-400 pulse-dot opacity-60" />
        <div className="absolute top-40 right-[18%] w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot opacity-50" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-32 left-[25%] w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot opacity-40" style={{ animationDelay: '1.3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 bg-white/70 backdrop-blur-sm text-sm text-indigo-700 font-medium mb-8 shadow-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 pulse-dot" />
                  Amazon Developer Hackathon 2026
                </span>
                <span className="text-indigo-300">·</span>
                <span>Alexa+ Track</span>
              </div>

              <h1 className="text-[44px] sm:text-[52px] font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                Turn career goals into{' '}
                <span className="gradient-text">your next best action</span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed mb-10">
                CareerPilot is your AI career agent. It understands your goals, finds matching
                opportunities, explains your fit, identifies skill gaps, and creates a personalized
                action plan — in one conversation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-primary text-base font-bold"
                >
                  Login to CareerPilot
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Social proof stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { val: '22+', label: 'Opportunities' },
                  { val: '6', label: 'MCP Tools' },
                  { val: '100%', label: 'Match Transparency' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-black gradient-text">{s.val}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="relative lg:flex justify-center">
              <div className="relative w-full max-w-[520px] mx-auto">
                <Image
                  src="/images/career/hero-illustration.svg"
                  alt="CareerPilot AI agent workspace showing opportunity matching, skill analysis, and career planning"
                  width={520}
                  height={420}
                  className="w-full drop-shadow-2xl"
                  priority
                />
                {/* Floating badges */}
                <div className="absolute -top-4 right-8 bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-indigo-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">MCP 2025-11-25</div>
                    <div className="text-[10px] text-slate-500">Streamable HTTP</div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-4 bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-indigo-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AWS</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Amazon Bedrock</div>
                    <div className="text-[10px] text-slate-500">Optional AI provider</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MCP workflow preview ──────────────────────────────── */}
      <section className="py-14 bg-white border-y border-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            A real MCP-powered workflow
          </p>
          <div className="rounded-3xl border border-indigo-100 overflow-hidden shadow-lg">
            {/* Terminal bar */}
            <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-slate-400 font-mono">CareerPilot workflow preview</span>
              <span className="ml-auto text-xs text-cyan-300 font-mono">Illustrative · no live calls</span>
            </div>
            {/* Chat */}
            <div className="bg-slate-50 p-6 space-y-4">
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-md px-5 py-3 text-sm max-w-sm">
                  I want an AI/ML internship in Hyderabad. I know Python, ML, Java, and SQL.
                </div>
              </div>

              {/* Activity panel */}
              <div className="bg-white rounded-xl border border-indigo-100 p-4 max-w-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">Typical agent workflow</span>
                </div>
                {workflowPreview.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-[9px] font-bold">{i + 1}</span>
                    </div>
                    <span className="text-xs text-slate-600">{item.step}</span>
                    <span className="ml-auto text-[9px] text-indigo-500 font-mono">{item.tool}</span>
                  </div>
                ))}
                <p className="mt-3 text-[10px] text-slate-400">Actual tool calls and results appear in the AI Agent.</p>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-[10px] font-bold">CP</span>
                </div>
                <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-md px-5 py-3 shadow-sm max-w-lg">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Share a goal such as <strong className="text-indigo-700">“I want an AI/ML internship in Hyderabad.”</strong>
                    CareerPilot can search the current opportunity data, explain the match against your profile,
                    and recommend next steps. Results depend on your profile and the roles that match your request.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['get_candidate_profile', 'search_opportunities', 'analyze_match'].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-medium">
                        🔧 {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700 transition-colors">
              Login to try the full AI agent experience
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #f8f7ff 0%, #ffffff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-5">
              Built different
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-5">
              Everything you need to land your{' '}
              <span className="gradient-text">next role</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              CareerPilot goes beyond listings. It acts as your personal career agent — searching,
              analyzing, planning, and preparing you at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border p-6 premium-card bg-gradient-to-br ${f.color} ${f.border}`}
              >
                {/* Icon */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 flex-shrink-0">{f.icon}</div>
                  <Image
                    src={`/images/career/${f.illustration}`}
                    alt=""
                    aria-hidden="true"
                    width={128}
                    height={84}
                    className="w-28 h-[72px] object-contain"
                  />
                </div>
                {/* Badge */}
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 ${f.badgeColor}`}>
                  {f.badge}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-5">
              Your career journey,{' '}
              <span className="gradient-text">in 6 steps</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              From goal-setting to offer-ready in a single conversation with your AI career agent.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-[8.333%] right-[8.333%] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-emerald-200 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 lg:gap-4 relative z-10">
              {steps.map((s) => (
                <div key={s.num} className="flex flex-col items-center text-center">
                  {/* Circle */}
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${s.color} flex flex-col items-center justify-center mb-5 shadow-lg`}>
                    <span className="text-3xl mb-1">{s.icon}</span>
                    <span className="text-white text-xs font-bold opacity-80">{s.num}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.desc}</p>
                  {/* Example chips */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {s.examples.map((ex) => (
                      <span key={ex} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-14">
            <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl btn-primary text-base font-bold">
              Login to start your career journey
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── MCP Architecture visualization ───────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1040 50%, #0f1f3a 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-[0.07]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 text-sm font-medium mb-6">
              Alexa+ MCP Architecture
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-5">
              A real{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                MCP-powered
              </span>{' '}
              agent
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              CareerPilot uses the official MCP SDK with session-aware Streamable HTTP — not a REST wrapper with &ldquo;MCP&rdquo; in the README.
            </p>
          </div>

          {/* Architecture diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Agent */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-black">CP</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">CareerPilot Agent</h3>
              <p className="text-slate-400 text-sm">Intent detection · Tool selection · AI generation via Bedrock</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px]">initialize</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px]">tools/call</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px]">session-aware</span>
              </div>
            </div>

            {/* Arrow + MCP label */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <div className="text-slate-400 text-xs font-mono mb-2">MCP 2025-11-25</div>
                <div className="flex items-center gap-1">
                  <div className="h-px flex-1 bg-indigo-500/40" />
                  <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div className="h-px flex-1 bg-indigo-500/40" />
                </div>
                <div className="text-slate-500 text-[10px] font-mono mt-2">Streamable HTTP</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-px flex-1 bg-cyan-500/40" />
                <svg className="w-6 h-6 text-cyan-400 rotate-180" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div className="h-px flex-1 bg-cyan-500/40" />
              </div>
              <div className="text-slate-500 text-[10px] font-mono">JSON-RPC 2.0 + SSE</div>
            </div>

            {/* MCP Server + Tools */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center">
                  <span className="text-cyan-400 text-xs font-bold">MCP</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">MCP Server :3001</div>
                  <div className="text-slate-500 text-[10px]">Session-aware · Per-client McpServer</div>
                </div>
              </div>
              <div className="space-y-2">
                {mcpTools.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-slate-300 truncate">{t.name}</div>
                    </div>
                    <span className="text-[9px] text-slate-500 whitespace-nowrap">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Protocol compliance */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Initialize Handshake', val: '✓ Supported' },
              { label: 'Session Management', val: '✓ Implemented' },
              { label: 'Streamable HTTP', val: '✓ POST/GET/DELETE' },
              { label: 'Amazon Bedrock', val: 'Optional provider' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                <div className="text-emerald-400 font-bold text-sm mb-1">{item.val}</div>
                <div className="text-slate-500 text-[11px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative overflow-hidden rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, #4F46FF 0%, #7C3AED 50%, #06B6D4 100%)' }}>
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="relative">
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                Ready to pilot your career?
              </h2>
              <p className="text-indigo-200 text-lg mb-8 max-w-lg mx-auto">
                Tell CareerPilot your goal. Let the AI agent do the heavy lifting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Login to CareerPilot
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base">CareerPilot</div>
                <div className="text-xs text-slate-400">Turn goals into action</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-slate-500 text-center">
                Amazon Developer Hackathon: Build, Ship, Shape 2026
              </p>
              <p className="text-xs text-slate-400 text-center">
                Alexa+ Track · AWS Builder Mini Challenge · MCP 2025-11-25 · Streamable HTTP
              </p>
            </div>
            <div className="flex gap-4">
              {['/dashboard', '/agent', '/opportunities', '/profile'].map((href) => (
                <Link key={href} href={href} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors capitalize">
                  {href.replace('/', '')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
