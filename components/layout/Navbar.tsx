'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavUser {
  email: string;
  profile: { name: string };
}

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/agent', label: 'AI Agent', icon: '✦' },
  { href: '/opportunities', label: 'Opportunities', icon: '⊙' },
  { href: '/profile', label: 'Profile', icon: '◎' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    fetch('/api/auth')
      .then(async (response) => {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        if (!response.ok) throw new Error('Unable to check sign-in status.');
        const data = await response.json() as { user: NavUser };
        setUser(data.user);
      })
      .catch((error: unknown) => {
        console.error('[Navbar] Session check failed:', error);
        setUser(null);
      })
      .finally(() => setSessionChecked(true));
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  async function handleSignOut() {
    const response = await fetch('/api/auth', { method: 'DELETE' });
    if (!response.ok) {
      console.error('[Navbar] Sign out failed:', await response.text());
      return;
    }
    setUser(null);
    setMobileOpen(false);
    router.replace('/');
    router.refresh();
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-indigo-100/80 shadow-sm'
            : 'bg-white/60 backdrop-blur-lg border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-300 transition-shadow">
                  <span className="text-white font-bold text-sm tracking-tight">CP</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-[17px] tracking-tight">
                  Career<span className="gradient-text">Pilot</span>
                </span>
                <div className="text-[9px] text-slate-400 font-medium tracking-widest uppercase -mt-0.5">
                  AI Career Agent
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className={`hidden md:flex items-center gap-0.5 ${user ? '' : 'invisible'}`}>
              {user && links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-xl bg-indigo-50/80 border border-indigo-100" />
                    )}
                    <span className="relative">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right: CTA + mobile toggle */}
            <div className="flex items-center gap-3">
              {user && <Link
                href="/agent"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2l.5 3h3l-2.5 2 1 3L8 8.5 6 10l1-3L4.5 5h3L8 2z" fill="currentColor"/>
                </svg>
                Start Planning
              </Link>}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="max-w-32 truncate text-xs font-semibold text-slate-600" title={user.email}>
                    {user.profile.name}
                  </span>
                  <button onClick={handleSignOut} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    Sign out
                  </button>
                </div>
              ) : sessionChecked ? (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    Login
                  </Link>
                </div>
              ) : <div className="h-9 w-16" aria-hidden="true" />}

              {/* Mobile hamburger */}
              {user && <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileOpen}
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className={`h-0.5 bg-current rounded transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`h-0.5 bg-current rounded transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
                  <span className={`h-0.5 bg-current rounded transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </div>
              </button>}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-indigo-100 shadow-xl px-4 py-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {user && links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            {user && <div className="pt-2 border-t border-slate-100">
              <Link
                href="/agent"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl btn-primary text-sm font-semibold"
              >
                ✦ Start Career Planning
              </Link>
              {user ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="truncate pr-3 text-sm font-semibold text-slate-700">{user.profile.name}</span>
                  <button onClick={handleSignOut} className="shrink-0 text-sm font-bold text-indigo-600">Sign out</button>
                </div>
              ) : null}
            </div>}
          </div>
        </div>
      )}
    </>
  );
}
