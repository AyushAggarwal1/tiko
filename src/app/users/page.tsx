"use client";

import { useEffect, useState } from 'react';

type User = { id: string; email: string; name?: string | null };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => { loadUsers(); }, []);

  async function createUser() {
    if (!email.trim() || password.trim().length < 6 || creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, password }) });
      if (!res.ok) { const d = await res.json().catch(()=>({})); setError(d?.error ?? 'Failed'); return; }
      setEmail(''); setName(''); setPassword(''); loadUsers();
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm('Remove this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) loadUsers();
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>
          <div className="flex items-center gap-2 text-sm">
            <a href="/categories" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Categories</a>
            <a href="/tickets" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Tickets</a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Total users</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{users.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div>
              <label className="text-xs text-secondary-600">Search</label>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Email or name" className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>
          <div className="mt-2 text-xs text-secondary-600">Showing {users.filter(u => !query.trim() || u.email.toLowerCase().includes(query.toLowerCase()) || (u.name || '').toLowerCase().includes(query.toLowerCase())).length} of {users.length}</div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Create user</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-secondary-300 px-3 py-2" />
              <p className="mt-1 text-xs text-secondary-600">Must be a valid email.</p>
            </div>
            <div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name (optional)" className="w-full rounded-lg border border-secondary-300 px-3 py-2" />
              <p className="mt-1 text-xs text-secondary-600">Shown in lists if provided.</p>
            </div>
            <div className="md:col-span-2">
              <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full rounded-lg border border-secondary-300 px-3 py-2" />
              <p className="mt-1 text-xs text-secondary-600">At least 6 characters.</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-secondary-600">User will be added to your organization.</div>
            <div className="flex items-center gap-3">
              {error && <span className="text-danger-600 text-sm">{error}</span>}
              <button onClick={() => { setEmail(''); setName(''); setPassword(''); setError(null); }} className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Reset</button>
              <button disabled={!email.trim() || password.trim().length < 6 || creating} onClick={createUser} className={`rounded-lg px-4 py-2 text-white ${(!email.trim() || password.trim().length < 6 || creating) ? 'bg-secondary-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>{creating ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">All users</h2>
          <ul className="divide-y">
            {users.filter(u => !query.trim() || u.email.toLowerCase().includes(query.toLowerCase()) || (u.name || '').toLowerCase().includes(query.toLowerCase())).map(u => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <div><p className="font-medium">{u.email}</p>{u.name && <p className="text-sm text-secondary-600">{u.name}</p>}</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigator.clipboard.writeText(u.email)} className="text-xs text-primary-600 hover:underline">Copy email</button>
                  <span className="text-xs text-secondary-500">{u.id.slice(0,8)}</span>
                  <button onClick={() => deleteUser(u.id)} className="text-danger-600 text-xs hover:underline">Remove</button>
                </div>
              </li>
            ))}
            {users.length === 0 && <li className="py-2 text-center text-sm text-secondary-600">No users yet.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}


