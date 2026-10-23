'use client';

import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';

const DRAFT_KEY = 'careerpilot-registration-draft';
const suggestedSkills = ['Python', 'Machine Learning', 'JavaScript', 'SQL', 'React', 'AWS', 'Data Analysis', 'Git'];
const availableLocations = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune', 'Mumbai', 'Remote'];

const draftSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  targetRole: z.string(),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid']),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationYear: z.string(),
  careerGoals: z.string(),
  skills: z.array(z.string()),
  preferredLocations: z.array(z.string()),
});

type RegistrationDraft = z.infer<typeof draftSchema>;

const emptyDraft: RegistrationDraft = {
  name: '',
  email: '',
  password: '',
  targetRole: '',
  experienceLevel: 'student',
  institution: '',
  degree: '',
  field: '',
  graduationYear: '',
  careerGoals: '',
  skills: [],
  preferredLocations: [],
};

export default function RegisterWizard({ step }: { step: 1 | 2 | 3 }) {
  const router = useRouter();
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth').then((response) => {
      if (response.ok && active) router.replace('/dashboard');
    }).catch((loadError: unknown) => {
      console.error('[Registration] Session check failed:', loadError);
    });

    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        const restored = saved ? draftSchema.parse(JSON.parse(saved)) : emptyDraft;
        if (active) {
          setDraft(restored);
          setReady(true);
          if (step > 1 && (!restored.name || !restored.email || !restored.password)) {
            router.replace('/register');
          } else if (step > 2 && (!restored.targetRole || !restored.careerGoals)) {
            router.replace('/register/career');
          }
        }
      } catch (restoreError) {
        console.error('[Registration] Failed to restore registration progress:', restoreError);
        if (active) {
          setError('We could not restore your registration steps. Please start again.');
          setReady(true);
        }
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(restoreTimer);
    };
  }, [router, step]);

  function update<K extends keyof RegistrationDraft>(key: K, value: RegistrationDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveDraft(nextDraft: RegistrationDraft) {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
      return true;
    } catch (storageError) {
      console.error('[Registration] Failed to save registration progress:', storageError);
      setError('Your browser could not save this step. Check available storage and try again.');
      return false;
    }
  }

  function addSkill(value: string) {
    const skill = value.trim();
    if (!skill || draft.skills.some((item) => item.toLowerCase() === skill.toLowerCase()) || draft.skills.length >= 30) return;
    update('skills', [...draft.skills, skill]);
    setSkillInput('');
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(skillInput);
    }
  }

  function toggleLocation(location: string) {
    update(
      'preferredLocations',
      draft.preferredLocations.includes(location)
        ? draft.preferredLocations.filter((item) => item !== location)
        : [...draft.preferredLocations, location],
    );
  }

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (step === 1 && draft.password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    if (step === 2 && draft.preferredLocations.length === 0) {
      setError('Choose at least one preferred location.');
      return;
    }
    const nextDraft = { ...draft, password: draft.password };
    if (!saveDraft(nextDraft)) return;
    router.push(step === 1 ? '/register/career' : '/register/education');
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (draft.skills.length === 0) {
      setError('Add at least one skill so CareerPilot can personalize your matches.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: draft.email,
          password: draft.password,
          name: draft.name,
          targetRole: draft.targetRole,
          experienceLevel: draft.experienceLevel,
          institution: draft.institution,
          degree: draft.degree,
          field: draft.field,
          graduationYear: Number(draft.graduationYear),
          skills: draft.skills,
          preferredLocations: draft.preferredLocations,
          careerGoals: draft.careerGoals,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to create your account. Please try again.');
      sessionStorage.removeItem(DRAFT_KEY);
      router.replace('/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-slate-500">Loading your registration…</div>;
  }

  const titles = [
    { eyebrow: 'Step 1 of 3 · Account', title: 'Create your account', description: 'Start with your name and secure sign-in details.' },
    { eyebrow: 'Step 2 of 3 · Career direction', title: 'Where are you headed?', description: 'Tell us what roles and locations you are working toward.' },
    { eyebrow: 'Step 3 of 3 · Education & skills', title: 'Add your experience', description: 'Share your education and skills to personalize your dashboard.' },
  ] as const;
  const current = titles[step - 1];

  return (
    <AuthShell
      eyebrow={current.eyebrow}
      title={current.title}
      description={current.description}
      footer={<>Already have an account? <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Login</Link></>}
    >
      <div className="mb-6 flex items-center gap-2" aria-label={`Registration step ${step} of 3`}>
        {titles.map((item, index) => (
          <div key={item.eyebrow} className={`h-1.5 flex-1 rounded-full ${index < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        ))}
      </div>
      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span aria-hidden="true">!</span><p>{error}</p>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={draft.name} onChange={(value) => update('name', value)} placeholder="Your name" autoComplete="name" required />
            <Field label="Email address" value={draft.email} onChange={(value) => update('email', value)} placeholder="you@example.com" type="email" autoComplete="email" required />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Password <span className="font-normal text-slate-400">· at least 10 characters</span></span>
              <span className="relative block">
                <input type={showPassword ? 'text' : 'password'} value={draft.password} onChange={(event) => update('password', event.target.value)} placeholder="Create a strong password" autoComplete="new-password" minLength={10} maxLength={128} required className="form-input pr-16" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">{showPassword ? 'Hide' : 'Show'}</button>
              </span>
            </label>
            <Field label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required />
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl btn-primary px-5 py-4 text-sm font-bold">Next: career direction <span aria-hidden="true">→</span></button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleNext} className="space-y-5">
          <Field label="Target role" value={draft.targetRole} onChange={(value) => update('targetRole', value)} placeholder="e.g. AI/ML Intern" required />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Experience level</span>
            <select value={draft.experienceLevel} onChange={(event) => update('experienceLevel', event.target.value as RegistrationDraft['experienceLevel'])} className="form-input">
              <option value="student">Student</option><option value="fresher">Fresher (0–1 year)</option><option value="junior">Junior (1–3 years)</option><option value="mid">Mid-level (3+ years)</option>
            </select>
          </label>
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-600">Preferred locations <span className="font-normal text-slate-400">· choose all that apply</span></span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred locations">
              {availableLocations.map((location) => {
                const selected = draft.preferredLocations.includes(location);
                return <button key={location} type="button" aria-pressed={selected} onClick={() => toggleLocation(location)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'}`}>{selected ? '✓ ' : ''}{location}</button>;
              })}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Career goal</span>
            <textarea value={draft.careerGoals} onChange={(event) => update('careerGoals', event.target.value)} placeholder="What kind of work would you love to do next?" minLength={10} maxLength={500} rows={4} required className="form-input resize-y" />
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => { saveDraft(draft); router.push('/register'); }} className="w-1/3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Back</button>
            <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-2xl btn-primary px-5 py-4 text-sm font-bold">Next: education & skills <span aria-hidden="true">→</span></button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School or institution" value={draft.institution} onChange={(value) => update('institution', value)} placeholder="University or college" required />
            <Field label="Degree" value={draft.degree} onChange={(value) => update('degree', value)} placeholder="e.g. B.Tech" required />
            <Field label="Field of study" value={draft.field} onChange={(value) => update('field', value)} placeholder="e.g. Computer Science" required />
            <Field label="Graduation year" value={draft.graduationYear} onChange={(value) => update('graduationYear', value)} type="number" min="1950" max="2100" required />
          </div>
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-600">Skills <span className="font-normal text-slate-400">· select suggestions or add your own</span></span>
            <div className="mb-3 flex flex-wrap gap-2">
              {draft.skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">{skill}<button type="button" onClick={() => update('skills', draft.skills.filter((item) => item !== skill))} aria-label={`Remove ${skill}`} className="rounded text-indigo-400 hover:text-rose-600">×</button></span>)}
            </div>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={handleSkillKeyDown} placeholder="Add a skill, then press Enter" className="form-input" aria-label="Add a skill" />
              <button type="button" onClick={() => addSkill(skillInput)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-100">Add</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestedSkills.filter((skill) => !draft.skills.includes(skill)).map((skill) => <button key={skill} type="button" onClick={() => addSkill(skill)} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">+ {skill}</button>)}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { saveDraft(draft); router.push('/register/career'); }} className="w-1/3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Back</button>
            <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-2xl btn-primary px-5 py-4 text-sm font-bold disabled:cursor-wait disabled:opacity-60">{submitting ? 'Creating your account…' : 'Create my CareerPilot account'}{!submitting && <span aria-hidden="true">→</span>}</button>
          </div>
          <p className="text-center text-[11px] leading-5 text-slate-400">Your details personalize career recommendations and are stored locally by this demo app.</p>
        </form>
      )}
    </AuthShell>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text', autoComplete, required, min, max }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} min={min} max={max} className="form-input" />
    </label>
  );
}
