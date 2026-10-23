'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CandidateProfile } from '@/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load profile');
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load profile');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || !profile) return;
    if (profile.skills.includes(trimmed)) return;
    setProfile({ ...profile, skills: [...profile.skills, trimmed] });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    if (!profile) return;
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600">{error ?? 'Profile not found'}</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Career Profile</h1>
          <p className="text-slate-500 mt-1">
            Keep your profile updated to get better opportunity matches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Image
            src="/images/career/profile.svg"
            alt=""
            aria-hidden="true"
            width={112}
            height={74}
            className="hidden sm:block w-24 h-auto"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Full Name"
              value={profile.name}
              onChange={(v) => setProfile({ ...profile, name: v })}
            />
            <Field
              label="Email"
              value={profile.email ?? ''}
              type="email"
              onChange={(v) => setProfile({ ...profile, email: v })}
            />
            <Field
              label="Target Role"
              value={profile.targetRole}
              onChange={(v) => setProfile({ ...profile, targetRole: v })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Experience Level
              </label>
              <select
                value={profile.experienceLevel}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    experienceLevel: e.target.value as CandidateProfile['experienceLevel'],
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="student">Student</option>
                <option value="fresher">Fresher (0–1 yr)</option>
                <option value="junior">Junior (1–3 yr)</option>
                <option value="mid">Mid-level (3+ yr)</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Career Goal</label>
            <textarea
              value={profile.careerGoals}
              onChange={(e) => setProfile({ ...profile, careerGoals: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            />
          </div>
        </Section>

        {/* Education */}
        <Section title="Education">
          {profile.education.map((edu, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
              <Field
                label="Institution"
                value={edu.institution}
                onChange={(v) => {
                  const ed = [...profile.education];
                  ed[i] = { ...ed[i], institution: v };
                  setProfile({ ...profile, education: ed });
                }}
              />
              <Field
                label="Degree"
                value={edu.degree}
                onChange={(v) => {
                  const ed = [...profile.education];
                  ed[i] = { ...ed[i], degree: v };
                  setProfile({ ...profile, education: ed });
                }}
              />
              <Field
                label="Field of Study"
                value={edu.field}
                onChange={(v) => {
                  const ed = [...profile.education];
                  ed[i] = { ...ed[i], field: v };
                  setProfile({ ...profile, education: ed });
                }}
              />
              <Field
                label="Graduation Year"
                value={String(edu.year)}
                type="number"
                onChange={(v) => {
                  const ed = [...profile.education];
                  ed[i] = { ...ed[i], year: parseInt(v) };
                  setProfile({ ...profile, education: ed });
                }}
              />
            </div>
          ))}
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-blue-400 hover:text-blue-700 text-xs leading-none"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a skill (press Enter)"
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </Section>

        {/* Preferred Locations */}
        <Section title="Preferred Locations">
          <div className="flex flex-wrap gap-2">
            {['Hyderabad', 'Bangalore', 'Chennai', 'Pune', 'Mumbai', 'Delhi', 'Remote'].map((loc) => {
              const selected = profile.preferredLocations.includes(loc);
              return (
                <button
                  key={loc}
                  onClick={() => {
                    const locs = selected
                      ? profile.preferredLocations.filter((l) => l !== loc)
                      : [...profile.preferredLocations, loc];
                    setProfile({ ...profile, preferredLocations: locs });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Projects */}
        <Section title={`Projects (${profile.projects.length})`}>
          {profile.projects.map((p, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <Field
                label="Project Name"
                value={p.name}
                onChange={(v) => {
                  const projs = [...profile.projects];
                  projs[i] = { ...projs[i], name: v };
                  setProfile({ ...profile, projects: projs });
                }}
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  value={p.description}
                  onChange={(e) => {
                    const projs = [...profile.projects];
                    projs[i] = { ...projs[i], description: e.target.value };
                    setProfile({ ...profile, projects: projs });
                  }}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              </div>
              <Field
                label="Technologies (comma separated)"
                value={p.technologies.join(', ')}
                onChange={(v) => {
                  const projs = [...profile.projects];
                  projs[i] = { ...projs[i], technologies: v.split(',').map((t) => t.trim()).filter(Boolean) };
                  setProfile({ ...profile, projects: projs });
                }}
              />
            </div>
          ))}
          <button
            onClick={() =>
              setProfile({
                ...profile,
                projects: [
                  ...profile.projects,
                  { name: '', description: '', technologies: [] },
                ],
              })
            }
            className="mt-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
          >
            + Add Project
          </button>
        </Section>
      </div>

      {/* Bottom save */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Changes Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
      />
    </div>
  );
}
