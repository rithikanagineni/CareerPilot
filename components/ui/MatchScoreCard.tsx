import type { MatchResult } from '@/types';

interface MatchScoreCardProps {
  match: MatchResult;
  companyName?: string;
  roleName?: string;
}

export default function MatchScoreCard({ match, companyName, roleName }: MatchScoreCardProps) {
  const { matchPercentage, matchingSkills, missingSkills, strengths, concerns, explanation } = match;

  const pct = matchPercentage;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashArray = (pct / 100) * circumference;

  const scoreConfig =
    pct >= 80 ? { label: 'Excellent Match', color: '#10B981', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-700' } :
    pct >= 65 ? { label: 'Strong Match', color: '#4F46FF', bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-100', text: 'text-indigo-700' } :
    pct >= 50 ? { label: 'Good Match', color: '#F59E0B', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-100', text: 'text-amber-700' } :
    { label: 'Partial Match', color: '#EF4444', bg: 'from-red-50 to-rose-50', border: 'border-red-100', text: 'text-red-600' };

  return (
    <div className="bg-white rounded-2xl border border-indigo-50 overflow-hidden shadow-sm">
      {/* Header with score */}
      <div className={`p-6 bg-gradient-to-br ${scoreConfig.bg} border-b ${scoreConfig.border}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {(companyName || roleName) && (
              <p className="text-sm text-slate-500 mb-2">
                {companyName && <strong className="text-slate-700">{companyName}</strong>}
                {companyName && roleName && <span className="text-slate-400"> — </span>}
                {roleName && <span>{roleName}</span>}
              </p>
            )}
            <div className={`text-5xl font-black ${scoreConfig.text} mb-1`}>{pct}%</div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${scoreConfig.border} ${scoreConfig.text} bg-white/70`}>
              {pct >= 80 ? '✦' : pct >= 65 ? '●' : pct >= 50 ? '◐' : '◯'} {scoreConfig.label}
            </span>
          </div>
          {/* Score ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" stroke="rgba(255,255,255,0.7)"/>
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10"
                stroke={scoreConfig.color}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-slate-900">{pct}%</span>
            </div>
          </div>
        </div>
        {/* Explanation */}
        <p className="mt-4 text-sm text-slate-600 leading-relaxed bg-white/50 rounded-xl p-3">{explanation}</p>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Matching skills */}
        {matchingSkills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[9px] flex items-center justify-center font-bold">✓</span>
              Strong Matches ({matchingSkills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.slice(0, 8).map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {missingSkills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[9px] flex items-center justify-center font-bold">!</span>
              Skill Gaps ({missingSkills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.slice(0, 8).map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score breakdown bar */}
      <div className="border-t border-slate-50 p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Score Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: 'Skills Match', value: Math.round((matchingSkills.length / Math.max(matchingSkills.length + missingSkills.length, 1)) * 50), max: 50, color: '#4F46FF' },
            { label: 'Location Match', value: match.locationMatch ? 20 : 5, max: 20, color: '#8B5CF6' },
            { label: 'Role Relevance', value: Math.round(match.roleRelevance * 0.2), max: 20, color: '#06B6D4' },
            { label: 'Project Experience', value: match.relevantProjects.length > 0 ? 10 : 0, max: 10, color: '#10B981' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28 flex-shrink-0">{item.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 w-10 text-right">{item.value}/{item.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + Concerns */}
      {(strengths.length > 0 || concerns.length > 0) && (
        <div className="border-t border-slate-50 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Why you qualify</h3>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {concerns.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Areas to improve</h3>
              <ul className="space-y-1.5">
                {concerns.map((c, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
