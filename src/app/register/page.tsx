"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationName, email, name, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d?.error ?? 'Failed');
      return;
    }
    router.push('/login');
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded-xl shadow">
        <input value={organizationName} onChange={(e)=>setOrganizationName(e.target.value)} placeholder="Organisation name" className="w-full border rounded px-2 py-2" />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-2 py-2" />
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Username" className="w-full border rounded px-2 py-2" />
        <div className="flex gap-2">
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type={show? 'text':'password'} className="w-full border rounded px-2 py-2" />
          <button type="button" onClick={()=>setShow(s=>!s)} className="border rounded px-2">{show? 'Hide':'Show'}</button>
        </div>
        {error && <p className="text-danger-600 text-sm">{error}</p>}
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">Create account</button>
      </form>
      <p className="mt-3 text-sm">Already have an account? <a href="/login" className="text-primary-600 hover:underline">Login</a></p>
    </main>
  );
}
