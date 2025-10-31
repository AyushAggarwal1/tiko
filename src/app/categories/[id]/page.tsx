"use client";

import { useEffect, useState } from 'react';
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
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Page header removed; using global header */}

      {!category ? (
        <p className="text-secondary-600">Loading...</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-semibold">{category.name} <span className="text-secondary-500 text-sm">({category.ticketsCount ?? tickets.length} tickets)</span></h2>
            {category.description && (<p className="mt-2 text-secondary-700">{category.description}</p>)}
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
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
          </div>
        </>
      )}
    </main>
  );
}
