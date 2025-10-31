"use client";

import { usePathname } from 'next/navigation';

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-secondary-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">T</span>
            <span className="text-lg font-semibold">Tiko</span>
          </a>
          <span className="text-secondary-400">→</span>
          <span className="text-sm font-medium text-secondary-700">{pageName}</span>
        </div>
      </div>
    </header>
  );
}


