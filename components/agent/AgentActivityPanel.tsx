import type { AgentActivity } from '@/types';

interface AgentActivityPanelProps {
  activities: AgentActivity[];
  isLoading: boolean;
}

const stepIcons: Record<string, string> = {
  'understanding': '🧠',
  'checking': '👤',
  'searching': '🔍',
  'analyzing': '📊',
  'identifying': '🎯',
  'creating': '📋',
  'generating': '🎤',
  'loading': '⚙️',
};

function getIcon(step: string): string {
  const lower = step.toLowerCase();
  for (const [key, icon] of Object.entries(stepIcons)) {
    if (lower.includes(key)) return icon;
  }
  return '⚡';
}

// Map step text to MCP tool name
function getMCPTool(step: string): string | null {
  const lower = step.toLowerCase();
  if (lower.includes('profile')) return 'get_candidate_profile';
  if (lower.includes('search') || lower.includes('opportunit')) return 'search_opportunities';
  if (lower.includes('match score') || lower.includes('analyzing match')) return 'analyze_match';
  if (lower.includes('skill gap') || lower.includes('identifying')) return 'analyze_skill_gaps';
  if (lower.includes('career plan') || lower.includes('action plan')) return 'create_career_plan';
  if (lower.includes('interview')) return 'generate_interview_prep';
  return null;
}

export default function AgentActivityPanel({
  activities,
  isLoading,
}: AgentActivityPanelProps) {
  if (!isLoading && activities.length === 0) return null;

  const completedCount = activities.filter((a) => a.status === 'completed').length;
  const totalCount = activities.length;

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin flex-shrink-0" />
          )}
          <span className="text-sm font-bold text-indigo-800">
            CareerPilot is working
            {isLoading && (
              <span className="inline-flex gap-0.5 ml-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            )}
          </span>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded-full border border-indigo-100">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {activities.map((activity, i) => {
          const icon = getIcon(activity.step);
          const mcpTool = getMCPTool(activity.step);

          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                activity.status === 'active'
                  ? 'bg-indigo-50/80 border border-indigo-100'
                  : activity.status === 'completed'
                  ? 'bg-slate-50 border border-transparent'
                  : 'border border-transparent'
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 mt-0.5">
                {activity.status === 'completed' ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : activity.status === 'active' ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                ) : activity.status === 'error' ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <span className={`text-sm font-medium ${
                    activity.status === 'active'
                      ? 'text-indigo-700'
                      : activity.status === 'completed'
                      ? 'text-slate-700'
                      : activity.status === 'error'
                      ? 'text-red-600'
                      : 'text-slate-400'
                  }`}>
                    {activity.step}
                  </span>
                </div>
                {/* MCP tool badge */}
                {mcpTool && activity.status !== 'pending' && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      activity.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : activity.status === 'active'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      <span>🔧</span>
                      MCP → {mcpTool}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {totalCount > 1 && (
        <div className="px-4 pb-4">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
