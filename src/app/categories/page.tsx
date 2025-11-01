"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CreateCategoryModal from "@/app/_components/CreateCategoryModal";

type Category = { id: string; name: string; description?: string | null; parentId?: string | null; ticketsCount?: number };
type TreeNode = Category & { children: TreeNode[] };
type CategoryOption = { id: string; label: string };
type Ticket = { id: string; title: string; description?: string | null; status: 'TODO'|'IN_PROGRESS'|'DONE'; createdAt: string; category?: { id: string; name: string } };

function buildTree(categories: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function buildOptions(nodes: TreeNode[], prefix: string[] = []): CategoryOption[] {
  const list: CategoryOption[] = [];
  for (const n of nodes) {
    const label = [...prefix, n.name].join(" / ");
    list.push({ id: n.id, label });
    if (n.children.length) list.push(...buildOptions(n.children, [...prefix, n.name]));
  }
  return list;
}

export default function CategoriesPage() {
  const search = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [recentDays, setRecentDays] = useState<string>('10');
  const [ticketStatus, setTicketStatus] = useState<'ALL' | Ticket['status']>('ALL');

  const tree = useMemo(() => buildTree(categories), [categories]);
  const options = useMemo(() => buildOptions(tree), [tree]);
  const stats = useMemo(() => {
    const total = categories.length;
    const roots = categories.filter(c => !c.parentId).length;
    const tickets = categories.reduce((sum, c) => sum + (c.ticketsCount ?? 0), 0);
    return { total, roots, tickets };
  }, [categories]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Category[];
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);
  const defaultParentFromQuery = search?.get('parentId') || undefined;
  const filteredRecent = useMemo(() => {
    const days = parseInt(recentDays || '10', 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (isNaN(days) ? 10 : days));
    return tickets
      .filter(t => new Date(t.createdAt) >= cutoff && (ticketStatus === 'ALL' || t.status === ticketStatus))
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [tickets, recentDays, ticketStatus]);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }
  async function loadTickets() {
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }

  useEffect(() => { loadCategories(); loadTickets(); }, []);
  // No preselect needed here; modal handles defaultParentId

  // Creation is handled inside modal

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category? This may also delete its tickets.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) loadCategories();
  }

  function Tree({ nodes }: { nodes: TreeNode[] }) {
    return (
      <ul className="space-y-1">
        {nodes.map((n) => (
          <li key={n.id}>
            <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-secondary-50">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                <a href={`/categories/${n.id}`} className="text-primary-600 hover:underline">{n.name}</a>
                <span className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs text-secondary-700">{n.ticketsCount ?? 0} tickets</span>
              </div>
              <button onClick={() => deleteCategory(n.id)} className="text-danger-600 text-xs hover:underline">Delete</button>
            </div>
            {n.children.length > 0 && (<div className="ml-4 mt-1 border-l pl-3"><Tree nodes={n.children} /></div>)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Categories</h1>
            <p className="text-sm text-secondary-600">Manage your category hierarchy and sub-categories</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-white shadow-md shadow-primary-300 ring-2 ring-primary-200 transition hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z"/></svg>
              New category
            </button>
            <a href="/tickets" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Tickets</a>
            <a href="/users" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Users</a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Total categories</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Root categories</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.roots}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Tickets across categories</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.tickets}</div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Category Tree</h2>
            <div className="flex items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories" className="rounded-lg border border-secondary-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>
          {categories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-secondary-600">No categories yet. Click "New category" to create one.</div>
          ) : (
            <Tree nodes={tree} />
          )}
          {query.trim() && (
            <div className="mt-4">
              <div className="mb-1 text-sm font-medium text-secondary-700">Search results</div>
              <ul className="divide-y rounded-lg border">
                {matches.map(m => (
                  <li key={m.id} className="flex items-center justify-between p-2">
                    <a href={`/categories/${m.id}`} className="text-primary-600 hover:underline">{m.name}</a>
                    <span className="text-xs text-secondary-600">{m.ticketsCount ?? 0} tickets</span>
                  </li>
                ))}
                {matches.length === 0 && (<li className="p-2 text-sm text-secondary-600">No matches</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent tickets</h2>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <select value={recentDays} onChange={e=>setRecentDays(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="7">Last 7 days</option>
              <option value="10">Last 10 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <select value={ticketStatus} onChange={e=>setTicketStatus(e.target.value as any)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="ALL">All status</option>
              <option value="TODO">To-do</option>
              <option value="IN_PROGRESS">In-progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <ul className="divide-y rounded-lg border">
            {filteredRecent.map(t => (
              <li key={t.id} className="flex items-center justify-between p-2">
                <div className="min-w-0">
                  <a href={`/tickets/${t.id}`} className="truncate text-primary-600 hover:underline">{t.title}</a>
                  <div className="text-xs text-secondary-600">{t.category?.name || 'Uncategorized'}</div>
                </div>
                <div className="ml-2 whitespace-nowrap text-xs text-secondary-600">{new Date(t.createdAt).toLocaleDateString()}</div>
              </li>
            ))}
            {filteredRecent.length === 0 && (<li className="p-3 text-center text-sm text-secondary-600">No tickets in this range.</li>)}
          </ul>
          <div className="mt-3 text-right">
            <a href="/tickets" className="text-sm text-primary-600 hover:underline">Open tickets →</a>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <CreateCategoryModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          defaultParentId={defaultParentFromQuery}
          onCreated={() => { loadCategories(); }}
        />
      )}
    </main>
  );
}


