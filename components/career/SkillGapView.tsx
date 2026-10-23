import type { SkillGap } from '@/types';

interface SkillGapViewProps {
  skillGap: SkillGap;
  targetRole?: string;
}

const priorityConfig = {
  high: {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    card: 'border-l-red-400 bg-red-50/50',
    dot: 'bg-red-400',
    time: 'text-red-600',
  },
  medium: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    card: 'border-l-amber-400 bg-amber-50/50',
    dot: 'bg-amber-400',
    time: 'text-amber-600',
  },
  low: {
    bar: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    card: 'border-l-slate-300 bg-slate-50/50',
    dot: 'bg-slate-300',
    time: 'text-slate-500',
  },
};

export default function SkillGapView({ skillGap, targetRole }: SkillGapViewProps) {
  const high = skillGap.missingSkills.filter((s) => s.priority === 'high');
  const medium = skillGap.missingSkills.filter((s) => s.priority === 'medium');
  const low = skillGap.missingSkills.filter((s) => s.priority === 'low');
  const allMissing = [...high, ...medium, ...low];

  const readinessColor =
    skillGap.overallReadiness >= 70 ? '#10B981' :
    skillGap.overallReadiness >= 50 ? '#4F46FF' : '#F59E0B';

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashArray = (skillGap.overallReadiness / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-indigo-50 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-indigo-100">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="font-bold text-slate-900">Skill Gap Analysis</h2>
            {targetRole && <p className="text-xs text-slate-500 mt-0.5">For: {targetRole}</p>}
          </div>
          {/* Readiness ring */}
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" stroke="rgba(255,255,255,0.6)"/>
              <circle
                cx="50" cy="50" r={radius} fill="none" strokeWidth="9"
                stroke={readinessColor}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900">{skillGap.overallReadiness}%</span>
              <span className="text-[9px] text-slate-500 font-medium">ready</span>
            </div>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            ✓ {skillGap.existingSkills.length} mastered
          </span>
          {high.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
              ! {high.length} critical gaps
            </span>
          )}
          {medium.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
              ◐ {medium.length} medium
            </span>
          )}
        </div>
      </div>

      {/* Existing skills + gaps side by side */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skills You Have</h3>
          {skillGap.existingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skillGap.existingSkills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                  ✓ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Add skills to your profile.</p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skills to Develop</h3>
          <div className="flex flex-wrap gap-1.5">
            {allMissing.map((s) => {
              const cfg = priorityConfig[s.priority];
              return (
                <span key={s.skill} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.badge}`}>
                  {s.skill}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skill progress bars */}
      {(skillGap.existingSkills.length > 0 || allMissing.length > 0) && (
        <div className="border-t border-slate-50 px-5 py-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skill Levels</h3>
          <div className="space-y-2.5">
            {skillGap.existingSkills.slice(0, 4).map((skill, i) => {
              const pct = Math.min(95, 65 + i * 8);
              return (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-medium w-24 flex-shrink-0 truncate">{skill}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
            {allMissing.slice(0, 3).map((s) => {
              const cfg = priorityConfig[s.priority];
              const pct = s.priority === 'high' ? 20 : s.priority === 'medium' ? 35 : 50;
              return (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium w-24 flex-shrink-0 truncate">{s.skill}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning roadmap */}
      {allMissing.length > 0 && (
        <div className="border-t border-slate-50 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Learning Roadmap</h3>
          <div className="space-y-2.5">
            {allMissing.map((item) => {
              const cfg = priorityConfig[item.priority];
              return (
                <div key={item.skill} className={`border-l-4 pl-3 pr-3 py-3 rounded-r-xl ${cfg.card}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{item.skill}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.badge}`}>
                        {item.priority}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold flex-shrink-0 ${cfg.time}`}>
                      ⏱ {item.estimatedTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{item.reason}</p>
                  <p className="text-xs text-indigo-600 font-medium">→ {item.recommendedAction}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
