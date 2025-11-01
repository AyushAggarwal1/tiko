"use client";

import { useEffect, useMemo, useState } from 'react';
import CreateCategoryModal from '@/app/_components/CreateCategoryModal';
import CreateTicketModal from '@/app/_components/CreateTicketModal';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/app/_components/Badges';

type Category = { id: string; name: string; description?: string | null; ticketsCount?: number };

type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW'|'MEDIUM'|'HIGH';
};

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<'ALL' | Ticket['status']>('ALL');
  const [priority, setPriority] = useState<'ALL' | Ticket['priority']>('ALL');
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [loading, setLoading] = useState(false);

  const counts = useMemo(() => {
    const total = tickets.length;
    const todo = tickets.filter(t => t.status === 'TODO').length;
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const done = tickets.filter(t => t.status === 'DONE').length;
    return { total, todo, inProgress, done };
  }, [tickets]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`);
      const data = await res.json();
      setCategory(data.category ?? null);
      setTickets(data.tickets ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  

  const filtered = tickets.filter(t => {
    const matchesQuery = query.trim().length === 0 || t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'ALL' || t.status === status;
    const matchesPriority = priority === 'ALL' || t.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      {/* Header */}
      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-secondary-600"><a href="/categories" className="hover:underline">Categories</a> <span className="text-secondary-400">/</span> <span>{category?.name || '...'}</span></div>
            <h1 className="text-xl font-semibold">Category details</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setShowCreateSub(true)} className="rounded-lg bg-secondary-200 px-3 py-2 text-secondary-900 hover:bg-secondary-300">Create sub-category</button>
            <button onClick={() => setShowCreateTicket(true)} className="rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700">Create ticket</button>
          </div>
        </div>
      </section>

      {loading || !category ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse">
                <div className="h-4 w-24 rounded bg-secondary-200" />
                <div className="mt-2 h-6 w-16 rounded bg-secondary-200" />
              </div>
            ))}
          </section>
          <section className="rounded-xl bg-white p-4 shadow animate-pulse">
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="h-10 rounded bg-secondary-200" />
              <div className="h-10 rounded bg-secondary-200" />
              <div className="h-10 rounded bg-secondary-200" />
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2"><div className="h-4 w-40 rounded bg-secondary-200" /></td>
                      <td className="p-2"><div className="h-4 w-60 rounded bg-secondary-200" /></td>
                      <td className="p-2"><div className="h-6 w-24 rounded bg-secondary-200" /></td>
                      <td className="p-2"><div className="h-6 w-20 rounded bg-secondary-200" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          {showCreateSub && (
            <CreateCategoryModal open={showCreateSub} onClose={() => setShowCreateSub(false)} defaultParentId={id} onCreated={() => { setShowCreateSub(false); load(); }} />
          )}
          {showCreateTicket && (
            <CreateTicketModal open={showCreateTicket} onClose={() => setShowCreateTicket(false)} defaultCategoryId={id} onCreated={() => { setShowCreateTicket(false); load(); }} />
          )}
          {/* Stats */}
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-secondary-600">Category</div>
              <div className="mt-1 text-base font-semibold text-secondary-900">{category.name}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-secondary-600">Total tickets</div>
              <div className="mt-1 text-2xl font-semibold text-secondary-900">{counts.total}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-secondary-600">In-progress</div>
              <div className="mt-1 text-2xl font-semibold text-secondary-900">{counts.inProgress}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-secondary-600">Done</div>
              <div className="mt-1 text-2xl font-semibold text-secondary-900">{counts.done}</div>
            </div>
          </section>

          {/* Description and quick actions */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
              <h2 className="mb-2 text-lg font-semibold">About this category</h2>
              {category.description ? (
                <p className="text-secondary-700">{category.description}</p>
              ) : (
                <p className="text-secondary-600">No description provided.</p>
              )}
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <h3 className="mb-2 text-sm font-semibold text-secondary-700">Quick links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/categories" className="text-primary-600 hover:underline">Back to Categories</a></li>
                <li><a href="/tickets" className="text-primary-600 hover:underline">Open Tickets</a></li>
              </ul>
            </div>
          </section>

          {/* Tickets */}
          <section className="rounded-xl bg-white p-4 shadow">
            <h3 className="mb-2 font-semibold">Tickets in this category</h3>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title or description" className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              <select value={status} onChange={e=>setStatus(e.target.value as any)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="ALL">All status</option>
                <option value="TODO">To-do</option>
                <option value="IN_PROGRESS">In-progress</option>
                <option value="DONE">Done</option>
              </select>
              <select value={priority} onChange={e=>setPriority(e.target.value as any)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="ALL">All priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-secondary-50 text-left text-secondary-600">
                    <th className="p-2 font-medium">Title</th>
                    <th className="p-2 font-medium">Description</th>
                    <th className="p-2 font-medium">Status</th>
                    <th className="p-2 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                      <td className="p-2 font-medium whitespace-nowrap"><a className="text-primary-600 hover:underline" href={`/tickets/${t.id}`}>{t.title}</a></td>
                      <td className="p-2 max-w-[24rem] truncate">{t.description || ''}</td>
                      <td className="p-2"><StatusBadge status={t.status} /></td>
                      <td className="p-2 whitespace-nowrap"><span className={`inline-block rounded px-2 py-0.5 text-xs ${t.priority==='HIGH'?'bg-danger-100 text-danger-700':t.priority==='MEDIUM'?'bg-warning-100 text-warning-700':'bg-success-100 text-success-700'}`}>{t.priority.charAt(0)+t.priority.slice(1).toLowerCase()}</span></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-secondary-600">No tickets match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
