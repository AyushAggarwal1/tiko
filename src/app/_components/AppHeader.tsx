"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getPageName(pathname: string): string {
  if (!pathname || pathname === '/') return 'Home';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/register')) return 'Register';
  if (pathname.startsWith('/categories')) return 'Category';
  if (pathname.startsWith('/tickets')) return 'Ticket';
  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export default function AppHeader() {
  const pathname = usePathname();
  const pageName = getPageName(pathname || '/');
  const [isAuthed, setIsAuthed] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setIsAuthed(!!data?.ok);
      } catch {
        if (!cancelled) setIsAuthed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    try {
      const [catsRes, tixRes] = await Promise.all([
        fetch('/api/categories', { cache: 'no-store' }).then(r=>r.json()).catch(()=>({})),
        fetch('/api/tickets', { cache: 'no-store' }).then(r=>r.json()).catch(()=>({})),
      ]);
      const categories = (catsRes?.categories || []).filter((c: any) => (c.name || '').toLowerCase().includes(q.toLowerCase()));
      const tickets = (tixRes?.tickets || []).filter((t: any) => (t.title || '').toLowerCase().includes(q.toLowerCase()));
      if (tickets.length > 0) { window.location.href = `/tickets/${tickets[0].id}`; return; }
      if (categories.length > 0) { window.location.href = `/categories/${categories[0].id}`; return; }
      window.location.href = '/tickets';
    } catch {}
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <a href={isAuthed ? "/dashboard" : "/"} className="flex items-center gap-2 text-secondary-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">T</span>
            <span className="text-lg font-semibold">Tiko</span>
          </a>
          <span className="text-secondary-400">→</span>
          <span className="text-sm font-medium text-secondary-700">{pageName}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthed && (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <a href="/categories" className="rounded-lg px-2 py-1 text-sm text-secondary-800 hover:bg-secondary-100">Categories</a>
                <a href="/tickets" className="rounded-lg px-2 py-1 text-sm text-secondary-800 hover:bg-secondary-100">Tickets</a>
                <a href="/users" className="rounded-lg px-2 py-1 text-sm text-secondary-800 hover:bg-secondary-100">Users</a>
              </div>
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === 'Enter') runSearch(); }}
                className="hidden w-56 rounded-lg border border-secondary-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 md:block"
                placeholder="Search tickets or categories"
                aria-label="Search"
              />
            </>
          )}
          {isAuthed ? (
            <>
              <a href="/dashboard" className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">Dashboard</a>
              <button onClick={logout} className="rounded-lg bg-secondary-200 px-3 py-2 text-sm text-secondary-900 hover:bg-secondary-300">Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Login</a>
              <a href="/register" className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">Get started</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


