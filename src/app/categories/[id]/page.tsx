"use client";

import { useEffect, useMemo, useState } from 'react';
import CreateCategoryModal from '@/app/_components/CreateCategoryModal';
import { useParams, useRouter } from 'next/navigation';

type Category = { id: string; name: string; description?: string | null; ticketsCount?: number };

type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<'ALL' | Ticket['status']>('ALL');
  const [showCreateSub, setShowCreateSub] = useState(false);

  const counts = useMemo(() => {
    const total = tickets.length;
    const todo = tickets.filter(t => t.status === 'TODO').length;
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const done = tickets.filter(t => t.status === 'DONE').length;
    return { total, todo, inProgress, done };
  }, [tickets]);

  async function load() {
    const res = await fetch(`/api/categories/${id}`);
    const data = await res.json();
    setCategory(data.category ?? null);
    setTickets(data.tickets ?? []);
  }

  useEffect(() => { if (id) load(); }, [id]);

  function StatusBadge({ status }: { status: Ticket['status'] }) {
    const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
    const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  const filtered = tickets.filter(t => {
    const matchesQuery = query.trim().length === 0 || t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'ALL' || t.status === status;
    return matchesQuery && matchesStatus;
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
            <a href={`/tickets?categoryId=${id}`} className="rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700">Create ticket</a>
          </div>
        </div>
      </section>

      {!category ? (
        <p className="text-secondary-600">Loading...</p>
      ) : (
        <>
          {showCreateSub && (
            <CreateCategoryModal open={showCreateSub} onClose={() => setShowCreateSub(false)} defaultParentId={id} onCreated={() => { setShowCreateSub(false); load(); }} />
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
              <div className="hidden md:block" />
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-secondary-50 text-left text-secondary-600">
                    <th className="p-2 font-medium">Title</th>
                    <th className="p-2 font-medium">Description</th>
                    <th className="p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                      <td className="p-2 font-medium whitespace-nowrap"><a className="text-primary-600 hover:underline" href={`/tickets/${t.id}`}>{t.title}</a></td>
                      <td className="p-2 max-w-[24rem] truncate">{t.description || ''}</td>
                      <td className="p-2"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-secondary-600">No tickets match.</td></tr>
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
