import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserForSessionToken, sessionCookieName } from '@/lib/auth/store';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">Checking your session…</div>}>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  );
}

async function ProtectedContent({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const user = await getUserForSessionToken(cookieStore.get(sessionCookieName())?.value);
  if (!user) redirect('/');
  return children;
}
