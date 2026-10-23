import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
}

export default function AuthShell({
  children,
  eyebrow,
  title,
  description,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[linear-gradient(145deg,#f5f3ff_0%,#fbfcff_50%,#ecfeff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="pointer-events-none absolute inset-0 line-grid opacity-40" />
      <div className="bg-blob-1 pointer-events-none -left-64 -top-56" />
      <div className="bg-blob-3 pointer-events-none -bottom-36 right-0" />

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_28px_100px_rgba(79,70,255,0.14)] backdrop-blur-xl lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#312e81_0%,#4f46e5_48%,#0891b2_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 dot-grid opacity-15" />
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-8 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-sm font-black shadow-lg backdrop-blur">
                CP
              </span>
              <span className="text-lg font-bold tracking-tight">CareerPilot</span>
            </Link>

            <div className="mt-20 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                Your career, with a co-pilot
              </span>
              <h2 className="mt-6 text-4xl font-black leading-[1.12] tracking-tight">
                Big goals need a{' '}
                <span className="text-cyan-200">clear next step.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-indigo-100/90">
                Build your profile once. Get relevant roles, transparent match insights, and a practical plan made around you.
              </p>
            </div>
          </div>

          <div className="relative mt-10">
            <Image
              src="/images/career/hero-illustration.svg"
              alt="CareerPilot career matching and planning workspace"
              width={560}
              height={452}
              priority
              className="mx-auto w-full max-w-[440px] drop-shadow-2xl"
            />
            <div className="absolute bottom-3 left-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-300/20 text-emerald-200">✓</span>
                <span className="text-xs font-semibold">A plan that starts with you</span>
              </div>
            </div>
          </div>

          <p className="relative mt-8 text-xs text-indigo-100/70">
            Alexa+ track · Real MCP tools · Your profile stays yours
          </p>
        </section>

        <section className="flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-xl">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-700 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-md shadow-indigo-200">CP</span>
              Career<span className="gradient-text">Pilot</span>
            </Link>
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
            </div>
            {children}
            <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
              {footer}
            </div>
            <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
              Local demo authentication · Passwords are hashed and sessions use HTTP-only cookies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
