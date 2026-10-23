'use client';
import { useEffect, useState } from 'react';
import type { Opportunity } from '@/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  matchPercentage?: number;
  onAnalyzeMatch?: () => void;
  onAskAgent?: () => void;
}

// Generate a consistent color from company name
function companyColor(name: string): string {
  const colors = [
    'from-indigo-500 to-violet-600',
    'from-blue-500 to-cyan-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-indigo-600 to-blue-700',
    'from-purple-500 to-indigo-600',
    'from-blue-600 to-indigo-700',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

const domainIcons: Record<string, string> = {
  'AI/ML': '🤖',
  'Data Science': '📊',
  'Full Stack': '🌐',
  'Python Development': '🐍',
  'Cloud': '☁️',
  'Software Engineering': '⚙️',
};

export default function OpportunityCard({
  opportunity,
  matchPercentage,
  onAnalyzeMatch,
  onAskAgent,
}: OpportunityCardProps) {
  const {
    company,
    role,
    location,
    type,
    requiredSkills,
    stipend,
    salary,
    applicationDeadline,
    domain,
    description,
  } = opportunity;

  const deadlineDate = new Date(applicationDeadline);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const daysLeft = currentTime === null
    ? null
    : Math.ceil((deadlineDate.getTime() - currentTime) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 14;
  const isPast = daysLeft !== null && daysLeft <= 0;

  const matchConfig =
    matchPercentage === undefined ? null :
    matchPercentage >= 80 ? { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Excellent' } :
    matchPercentage >= 65 ? { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Strong' } :
    matchPercentage >= 50 ? { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Good' } :
    { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Partial' };

  const domainIcon = domainIcons[domain] ?? '💼';
  const gradientClass = companyColor(company);

  return (
    <div className="bg-white rounded-2xl border border-indigo-50 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
      {/* Top gradient accent */}
      <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Company logo placeholder */}
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white text-base font-black">{company.charAt(0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-indigo-700 transition-colors">
              {role}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{company}</p>
          </div>

          {/* Match score */}
          {matchConfig && matchPercentage !== undefined && (
            <div className={`flex-shrink-0 text-center px-3 py-1.5 rounded-xl ${matchConfig.bg}`}>
              <div className={`text-lg font-black leading-none ${matchConfig.text}`}>{matchPercentage}%</div>
              <div className={`text-[9px] font-bold mt-0.5 ${matchConfig.text}`}>{matchConfig.label}</div>
            </div>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
            📍 {location}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-xs font-medium text-violet-700">
            {type === 'internship' ? '🎓 Internship' : '💼 Full-time'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
            {domainIcon} {domain}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {requiredSkills.slice(0, 4).map((skill) => (
            <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
              {skill}
            </span>
          ))}
          {requiredSkills.length > 4 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
              +{requiredSkills.length - 4} more
            </span>
          )}
        </div>

        {/* Footer: stipend + deadline */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800">
            {stipend ?? salary ?? 'Competitive'}
          </span>
          {isPast ? (
            <span className="text-[11px] text-slate-400">Deadline passed</span>
          ) : isUrgent ? (
            <span className="text-[11px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
              ⚡ {daysLeft}d left
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Closes {deadlineDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
              })}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onAnalyzeMatch && (
            <button
              onClick={onAnalyzeMatch}
              className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold"
            >
              View Match →
            </button>
          )}
          {onAskAgent && (
            <button
              onClick={onAskAgent}
              className="flex-1 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Ask Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
