'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProgressBar from '@/components/ui/ProgressBar';
import type { CandidateProfile } from '@/types';

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-indigo-50 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm font-semibold text-slate-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ReadinessRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dashArray = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" stroke="#EEF2FF"/>
          <circle
            cx="50" cy="50" r={radius} fill="none" strokeWidth="8"
            stroke={color} strokeDasharray={`${dashArray} ${circumference}`}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900">{value}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 text-center">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const greeting = 'Welcome back';

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load profile');
        return r.json();
      })
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => { setError('Failed to load profile'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 shimmer rounded-xl w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-600 font-medium">{error ?? 'Profile not found'}</p>
        <button onClick={() => location.reload()} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  const skillCount = profile.skills.length;
  const projectCount = profile.projects.length;

  const profileCompleteness = Math.min(100, Math.round(
    (profile.name ? 20 : 0) +
    (profile.education.length > 0 ? 20 : 0) +
    (skillCount > 0 ? 20 : 0) +
    (projectCount > 0 ? 20 : 0) +
    (profile.careerGoals ? 20 : 0)
  ));
  const skillReadiness = Math.min(100, Math.round(skillCount * 14));
  const applicationReadiness = Math.min(100, Math.round(
    (profileCompleteness * 0.4) + (skillReadiness * 0.4) + (projectCount > 0 ? 20 : 0)
  ));

  const nextBestAction = {
    action: skillReadiness < 80
      ? 'Add more technical skills to your profile'
      : projectCount < 3
      ? 'Add a third project to improve match scores'
      : 'Apply to your top 3 matched opportunities',
    reason: skillReadiness < 80
      ? `You currently have ${skillCount} skills. Adding 2–3 more will increase your match scores by ~15%.`
      : projectCount < 3
      ? `3+ projects increases your application readiness to 90%+.`
      : 'Your profile is strong. Now is the time to apply while opportunities are open.',
    cta: skillReadiness < 80 ? '/profile' : projectCount < 3 ? '/profile' : '/agent',
    ctaLabel: skillReadiness < 80 ? 'Update Skills' : projectCount < 3 ? 'Add Project' : 'Find Opportunities',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f5f4ff 0%, #f0f5ff 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {profile.name.split(' ')[0]}&apos;s Career Dashboard
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Here&apos;s your career readiness at a glance.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Image
              src="/images/career/dashboard.svg"
              alt=""
              aria-hidden="true"
              width={148}
              height={96}
              className="hidden sm:block w-32 h-auto"
            />
            <Link href="/agent" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl btn-primary text-sm font-bold">
              ✦ Open AI Agent
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📊" label="Profile Complete" value={`${profileCompleteness}%`} color="bg-indigo-50" sub="Based on 5 criteria" />
          <StatCard icon="🎯" label="Skill Readiness" value={`${skillReadiness}%`} color="bg-violet-50" sub={`${skillCount} skills added`} />
          <StatCard icon="💼" label="Projects" value={projectCount} color="bg-emerald-50" sub="Verified implementations" />
          <StatCard icon="📍" label="Locations" value={profile.preferredLocations.length} color="bg-cyan-50" sub="Preferred cities" />
        </div>

        {/* Readiness rings + Next action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Readiness overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-indigo-50 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-6">Career Readiness Overview</h2>
            <div className="flex justify-around mb-8">
              <ReadinessRing value={profileCompleteness} label="Profile" color="#4F46FF" />
              <ReadinessRing value={skillReadiness} label="Skills" color="#8B5CF6" />
              <ReadinessRing value={applicationReadiness} label="Application" color="#10B981" />
            </div>
            {/* Skills breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Skills</p>
              {profile.skills.slice(0, 5).map((skill, i) => {
                const pct = Math.min(100, 60 + i * 10);
                return (
                  <ProgressBar
                    key={skill}
                    value={pct}
                    label={skill}
                    color={i === 0 ? 'blue' : i === 1 ? 'violet' : 'emerald'}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>

          {/* Next best action */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-3">
                ✦ Your Next Best Action
              </div>
              <p className="font-bold text-lg leading-snug mb-3">{nextBestAction.action}</p>
              <p className="text-sm text-indigo-200 leading-relaxed mb-5">{nextBestAction.reason}</p>
              <Link href={nextBestAction.cta} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors">
                {nextBestAction.ctaLabel} →
              </Link>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="space-y-1.5">
                {[
                  { icon: '🔍', label: 'Find matching internships', href: '/agent' },
                  { icon: '📊', label: 'Analyze my match score', href: '/agent' },
                  { icon: '🏢', label: 'Browse all opportunities', href: '/opportunities' },
                  { icon: '👤', label: 'Update my profile', href: '/profile' },
                ].map((a) => (
                  <Link key={a.label} href={a.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors group">
                    <span className="text-base">{a.icon}</span>
                    <span className="flex-1 text-sm text-slate-700 group-hover:text-indigo-700 font-medium">{a.label}</span>
                    <span className="text-slate-300 group-hover:text-indigo-400 transition-colors text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile summary + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Profile Summary</h2>
              <Link href="/profile" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">Edit →</Link>
            </div>
            <div className="p-5 space-y-4">
              {/* Name + edu */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{profile.name}</p>
                  {profile.education[0] && (
                    <p className="text-xs text-slate-500">
                      {profile.education[0].degree} · {profile.education[0].institution}
                    </p>
                  )}
                </div>
              </div>
              {/* Target role */}
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
                  🎯 {profile.targetRole}
                </span>
                {profile.preferredLocations.slice(0, 2).map(l => (
                  <span key={l} className="px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-xs font-semibold text-violet-700">
                    📍 {l}
                  </span>
                ))}
              </div>
              {/* Skills */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">{s}</span>
                  ))}
                </div>
              </div>
              {/* Goal */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Career Goal</p>
                <p className="text-sm text-slate-700 leading-relaxed">{profile.careerGoals}</p>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Projects ({projectCount})</h2>
              <Link href="/profile" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">Add project →</Link>
            </div>
            <div className="p-5 space-y-3">
              {profile.projects.map((p, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex-shrink-0">Project</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.technologies.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
              {projectCount === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">💻</div>
                  <p className="text-sm text-slate-500 mb-3">No projects yet. Add projects to improve your match scores.</p>
                  <Link href="/profile" className="text-sm text-indigo-600 font-semibold hover:underline">Add your first project →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
