"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { Suspense, useState } from 'react';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d?.error ?? 'Failed');
      return;
    }
    const dest: Route = (typeof next === 'string' && next.startsWith('/'))
      ? (next as Route)
      : '/dashboard';
    router.push(dest);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-secondary-900">Welcome back</h1>
          <p className="mt-1 text-secondary-600">Sign in to your Tiko dashboard</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Password</label>
            <div className="mt-1 flex gap-2">
              <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" type={show? 'text':'password'} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              <button type="button" onClick={()=>setShow(s=>!s)} className="rounded-lg border border-secondary-300 px-3 text-sm text-secondary-700 hover:bg-secondary-100">{show? 'Hide':'Show'}</button>
            </div>
          </div>
          {error && <p className="text-danger-600 text-sm">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow hover:bg-primary-700">Sign in</button>
        </form>
        <p className="mt-4 text-center text-sm text-secondary-600">No account? <a href="/register" className="text-primary-600 hover:underline">Create one</a></p>
        <div className="mt-2 text-center">
          <a href="/" className="text-sm text-secondary-600 hover:underline">Go to home</a>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-6 max-w-md mx-auto" />}> 
      <LoginInner />
    </Suspense>
  );
}
