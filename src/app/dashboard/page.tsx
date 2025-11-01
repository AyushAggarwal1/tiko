"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; parentId?: string | null; ticketsCount?: number };
type Ticket = { id: string; title: string; description?: string | null; status: "TODO"|"IN_PROGRESS"|"DONE"; categoryId: string; category?: { id: string; name: string } };
type User = { id: string; email: string; name?: string | null };

export default function Dashboard() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const stats = useMemo(() => ({ categories: categories.length, tickets: tickets.length, users: users.length }), [categories.length, tickets.length, users.length]);
  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);
  const topCategories = useMemo(() => [...categories].sort((a, b) => (b.ticketsCount ?? 0) - (a.ticketsCount ?? 0)).slice(0, 5), [categories]);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }
  async function loadTickets() {
    const res = await fetch("/api/tickets");
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }
  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => { loadCategories(); loadTickets(); loadUsers(); }, []);
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }

  function StatusBadge({ status }: { status: Ticket['status'] }) {
    const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
    const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      {/* Header */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-secondary-600">Overview and quick access</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <a href="/categories" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Categories</a>
            <a href="/tickets" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Tickets</a>
            <a href="/users" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Users</a>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-2 shadow">
        <div className="flex items-center gap-2">
          <a href="/categories" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Categories</a>
          <a href="/tickets" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Tickets</a>
          <a href="/users" className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Users</a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Categories</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.categories}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Tickets</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.tickets}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Users</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.users}</div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Recent tickets</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-secondary-50 text-left text-secondary-600">
                  <th className="p-2 font-medium">Title</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(t => (
                  <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                    <td className="p-2 whitespace-nowrap"><a href={`/tickets/${t.id}`} className="text-primary-600 hover:underline">{t.title}</a></td>
                    <td className="p-2"><StatusBadge status={t.status} /></td>
                    <td className="p-2 whitespace-nowrap">{t.category?.name || ''}</td>
                  </tr>
                ))}
                {recentTickets.length === 0 && (<tr><td colSpan={3} className="p-3 text-center text-secondary-600">No tickets yet.</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <a href="/tickets" className="text-sm text-primary-600 hover:underline">View all tickets →</a>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Top categories</h2>
          <ul className="divide-y">
            {topCategories.map(c => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <a href={`/categories/${c.id}`} className="text-primary-600 hover:underline">{c.name}</a>
                <span className="text-xs text-secondary-600">{c.ticketsCount ?? 0} tickets</span>
              </li>
            ))}
            {topCategories.length === 0 && (<li className="py-2 text-center text-sm text-secondary-600">No categories yet.</li>)}
          </ul>
          <div className="mt-3 text-right">
            <a href="/categories" className="text-sm text-primary-600 hover:underline">View all categories →</a>
          </div>
        </div>
      </section>
    </main>
  );
}
