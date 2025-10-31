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
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded-xl shadow">
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-2 py-2" />
        <div className="flex gap-2">
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type={show? 'text':'password'} className="w-full border rounded px-2 py-2" />
          <button type="button" onClick={()=>setShow(s=>!s)} className="border rounded px-2">{show? 'Hide':'Show'}</button>
        </div>
        {error && <p className="text-danger-600 text-sm">{error}</p>}
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">Sign in</button>
      </form>
      <p className="mt-3 text-sm">No account? <a href="/register" className="text-primary-600 hover:underline">Create one</a></p>
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
