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

  async function load() {
    const res = await fetch(`/api/categories/${id}`);
    const data = await res.json();
    setCategory(data.category ?? null);
    setTickets(data.tickets ?? []);
  }

  useEffect(() => { if (id) load(); }, [id]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-primary-600 hover:underline">← Back</button>
        <h1 className="text-2xl font-semibold">Category</h1>
        <span />
      </div>

      {!category ? (
        <p className="text-secondary-600">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow mb-4">
            <h2 className="text-lg font-semibold">{category.name} <span className="text-secondary-500 text-sm">({category.ticketsCount ?? tickets.length} tickets)</span></h2>
            {category.description && (
              <p className="mt-2 text-secondary-700">{category.description}</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold mb-2">Tickets in this category</h3>
            <ul className="divide-y">
              {tickets.map(t => (
                <li key={t.id} className="py-2 flex items-center justify-between">
                  <div>
                    <a className="text-primary-600 hover:underline" href={`/tickets/${t.id}`}>{t.title}</a>
                    {t.description && <p className="text-sm text-secondary-600">{t.description}</p>}
                  </div>
                  <span className="text-xs border rounded px-2 py-1">{t.status}</span>
                </li>
              ))}
              {tickets.length === 0 && (
                <li className="py-2 text-sm text-secondary-600">No tickets.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
