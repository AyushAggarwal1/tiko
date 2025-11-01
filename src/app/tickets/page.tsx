"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Category = { id: string; name: string; parentId?: string | null };
type Ticket = { id: string; title: string; description?: string | null; status: "TODO"|"IN_PROGRESS"|"DONE"; categoryId: string; category?: { id: string; name: string } };
type User = { id: string; email: string; name?: string | null };
type TreeNode = Category & { children: TreeNode[] };
type CategoryOption = { id: string; label: string };

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

export default function TicketsPage() {
  const search = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [ticketCategoryId, setTicketCategoryId] = useState<string | "">("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"ALL" | Ticket["status"]>("ALL");
  const [ticketCategory, setTicketCategory] = useState<string | "">("");

  const tree = useMemo(() => buildTree(categories), [categories]);
  const categoryOptions = useMemo(() => buildOptions(tree), [tree]);
  const stats = useMemo(() => {
    const total = tickets.length;
    const todo = tickets.filter(t => t.status === 'TODO').length;
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const done = tickets.filter(t => t.status === 'DONE').length;
    return { total, todo, inProgress, done };
  }, [tickets]);
  const titleValid = newTicketTitle.trim().length >= 2;
  const categoryValid = !!ticketCategoryId;

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
  // Preselect category from query param
  useEffect(() => {
    const cid = search?.get('categoryId');
    if (cid) {
      setTicketCategoryId((prev) => prev || cid);
      setTicketCategory((prev) => prev || cid);
    }
  }, [search]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesQuery = ticketQuery.trim().length === 0 || t.title.toLowerCase().includes(ticketQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(ticketQuery.toLowerCase());
      const matchesStatus = ticketStatus === 'ALL' || t.status === ticketStatus;
      const matchesCategory = !ticketCategory || t.categoryId === ticketCategory;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [tickets, ticketQuery, ticketStatus, ticketCategory]);

  async function createTicket() {
    if (!titleValid || !categoryValid || creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTicketTitle, description: newTicketDesc, categoryId: ticketCategoryId }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Failed to create ticket');
        return;
      }
      setNewTicketTitle(""); setNewTicketDesc(""); setTicketCategoryId("");
      loadTickets();
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  }

  function StatusBadge({ status }: { status: Ticket['status'] }) {
    const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
    const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  async function updateTicketStatus(id: string, status: Ticket["status"]) {
    const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) loadTickets();
  }

  async function updateTicketAssignee(id: string, assigneeId: string | "") {
    const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId: assigneeId || null }) });
    if (res.ok) loadTickets();
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-white shadow-md shadow-primary-300 ring-2 ring-primary-200 transition hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z"/></svg>
              New ticket
            </button>
            <a href="/categories" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Categories</a>
            <a href="/users" className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Users</a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Total</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">To-do</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.todo}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">In-progress</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.inProgress}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-secondary-600">Done</div>
          <div className="mt-1 text-2xl font-semibold text-secondary-900">{stats.done}</div>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
          <div className="relative mx-auto mt-24 w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded px-2 py-1 text-secondary-700 hover:bg-secondary-100">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <input value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Title (required)" />
                <p className="mt-1 text-xs text-secondary-600">At least 2 characters.</p>
              </div>
              <div>
                <select value={ticketCategoryId} onChange={(e) => setTicketCategoryId(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="">Select category/sub-category</option>
                  {categoryOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
                </select>
                <p className="mt-1 text-xs text-secondary-600">Pick where this ticket belongs.</p>
              </div>
              <div className="md:col-span-2">
                <input value={newTicketDesc} onChange={(e) => setNewTicketDesc(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Description (optional)" />
                <p className="mt-1 text-xs text-secondary-600">Optional: add more details for context.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              {error && <span className="text-danger-600 text-sm">{error}</span>}
              <button onClick={() => { setNewTicketTitle(''); setNewTicketDesc(''); setTicketCategoryId(''); setError(null); }} className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Reset</button>
              <button disabled={!titleValid || !categoryValid || creating} onClick={createTicket} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition focus:outline-none ${titleValid && categoryValid && !creating ? 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-300 ring-2 ring-primary-200 hover:shadow-lg focus:ring-4 focus:ring-primary-300' : 'bg-secondary-300 cursor-not-allowed'}`}>{creating ? 'Creating…' : 'Create ticket'}</button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">All tickets</h2>
        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input value={ticketQuery} onChange={e=>setTicketQuery(e.target.value)} placeholder="Search title or description" className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
          <select value={ticketStatus} onChange={e=>setTicketStatus(e.target.value as any)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
            <option value="ALL">All status</option>
            <option value="TODO">To-do</option>
            <option value="IN_PROGRESS">In-progress</option>
            <option value="DONE">Done</option>
          </select>
          <select value={ticketCategory} onChange={e=>setTicketCategory(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
            <option value="">All categories</option>
            {categoryOptions.map(o => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div className="mb-2 text-xs text-secondary-600">Showing {filteredTickets.length} of {tickets.length} tickets</div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-secondary-50 text-left text-secondary-600">
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Description</th>
                <th className="p-2 font-medium">Assignee</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                  <td className="p-2 font-medium whitespace-nowrap"><a href={`/tickets/${t.id}`} className="text-primary-600 hover:underline">{t.title}</a></td>
                  <td className="p-2 max-w-[24rem] truncate">{t.description || ""}</td>
                  <td className="p-2 whitespace-nowrap">
                    <select defaultValue={t["assigneeId" as any] || ''} onChange={(e) => updateTicketAssignee(t.id, e.target.value)} className="rounded-lg border border-secondary-300 px-2 py-1">
                      <option value="">Unassigned</option>
                      {users.map(u => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <select defaultValue={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value as Ticket["status"])} className="rounded-lg border border-secondary-300 px-2 py-1">
                        <option value="TODO">To-do</option>
                        <option value="IN_PROGRESS">In-progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">{t.category?.name || ''}</td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (<tr><td colSpan={5} className="p-4 text-center text-secondary-600">No tickets match.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


