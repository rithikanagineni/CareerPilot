'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth')
      .then((response) => {
        if (response.ok && active) router.replace('/dashboard');
      })
      .catch((loadError: unknown) => {
        console.error('[Login] Session check failed:', loadError);
      });
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to sign in. Please try again.');
      router.replace('/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your next step is waiting."
      description="Sign in to pick up where you left off, revisit your career profile, and keep your plan moving."
      footer={<>New to CareerPilot? <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700">Register</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
          <span className="relative block">
            <svg aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="4" width="15" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m3.5 6 6.5 4.5L16.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            Password
            <span className="text-xs font-normal text-slate-400">Your password stays private</span>
          </span>
          <span className="relative block">
            <svg aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none">
              <rect x="3.5" y="8" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="10" cy="12.5" r="1" fill="currentColor"/>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-12 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus-visible:outline-indigo-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl btn-primary px-5 py-3.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'Signing you in…' : 'Sign in to CareerPilot'}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">✦</span>
          <p className="text-xs leading-5 text-indigo-900/75">
            Your profile, opportunities, and next actions are together in one career workspace.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
