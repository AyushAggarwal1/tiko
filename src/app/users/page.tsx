"use client";

import { useEffect, useState } from 'react';

type User = { id: string; email: string; name?: string | null };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => { loadUsers(); }, []);

  async function createUser() {
    setError(null);
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, password }) });
    if (!res.ok) { const d = await res.json(); setError(d?.error ?? 'Failed'); return; }
    setEmail(''); setName(''); setPassword(''); loadUsers();
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

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Create user</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-secondary-300 px-3 py-2" />
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name (optional)" className="rounded-lg border border-secondary-300 px-3 py-2" />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="rounded-lg border border-secondary-300 px-3 py-2 md:col-span-2" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={createUser} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Create</button>
            {error && <span className="text-danger-600 text-sm">{error}</span>}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">All users</h2>
          <ul className="divide-y">
            {users.map(u => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <div><p className="font-medium">{u.email}</p>{u.name && <p className="text-sm text-secondary-600">{u.name}</p>}</div>
                <div className="flex items-center gap-3">
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


