"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CreateTicketModal from "@/app/_components/CreateTicketModal";
import CreateCategoryModal from "@/app/_components/CreateCategoryModal";

type Category = { id: string; name: string; parentId?: string | null };
type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO"|"IN_PROGRESS"|"DONE";
  priority: 'LOW'|'MEDIUM'|'HIGH';
  categoryId: string;
  category?: { id: string; name: string };
  assigneeId?: string | null;
  assignee?: { id: string; email: string; name?: string | null } | null;
};
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"ALL" | Ticket["status"]>("ALL");
  const [ticketPriority, setTicketPriority] = useState<'ALL' | Ticket['priority']>('ALL');
  const [ticketAssignee, setTicketAssignee] = useState<'ALL' | 'UNASSIGNED' | string>('ALL');
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
  function clearFilters() {
    setTicketQuery('');
    setTicketStatus('ALL');
    setTicketCategory('');
    setTicketPriority('ALL');
    setTicketAssignee('ALL');
  }

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
    if (cid) setTicketCategory((prev) => prev || cid);
    const openNew = search?.get('newTicket');
    if (openNew && !showCreateModal) setShowCreateModal(true);
  }, [search]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesQuery = ticketQuery.trim().length === 0 || t.title.toLowerCase().includes(ticketQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(ticketQuery.toLowerCase());
      const matchesStatus = ticketStatus === 'ALL' || t.status === ticketStatus;
      const matchesCategory = !ticketCategory || t.categoryId === ticketCategory;
      const p = ((t as any).priority as 'LOW'|'MEDIUM'|'HIGH'|undefined) || 'MEDIUM';
      const matchesPriority = ticketPriority === 'ALL' || p === ticketPriority;
      const aid = ((t as any).assigneeId as string | undefined) || '';
      const matchesAssignee = ticketAssignee === 'ALL' ? true : (ticketAssignee === 'UNASSIGNED' ? !aid : aid === ticketAssignee);
      return matchesQuery && matchesStatus && matchesCategory && matchesPriority && matchesAssignee;
    });
  }, [tickets, ticketQuery, ticketStatus, ticketCategory, ticketPriority, ticketAssignee]);

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
          <button onClick={() => setShowCreateCategory(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-primary-700 ring-2 ring-primary-200 transition hover:bg-primary-100 focus:outline-none focus:ring-4 focus:ring-primary-300">New category</button>
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
        <CreateTicketModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          defaultCategoryId={search?.get('categoryId') || undefined}
          onCreated={() => { loadTickets(); }}
        />
      )}
      {showCreateCategory && (
        <CreateCategoryModal
          open={showCreateCategory}
          onClose={() => setShowCreateCategory(false)}
          defaultParentId={ticketCategory || undefined}
          onCreated={() => { setShowCreateCategory(false); loadCategories(); }}
        />
      )}

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">All tickets</h2>
        <div className="mb-3 rounded-lg border bg-secondary-50 p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <div>
              <label className="text-xs text-secondary-600">Search</label>
              <input value={ticketQuery} onChange={e=>setTicketQuery(e.target.value)} placeholder="Title or description" className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
            <div>
              <label className="text-xs text-secondary-600">Status</label>
              <select value={ticketStatus} onChange={e=>setTicketStatus(e.target.value as any)} className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="ALL">All</option>
                <option value="TODO">To-do</option>
                <option value="IN_PROGRESS">In-progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary-600">Category</label>
              <select value={ticketCategory} onChange={e=>setTicketCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="">All</option>
                {categoryOptions.map(o => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary-600">Priority</label>
              <select value={ticketPriority} onChange={e=>setTicketPriority(e.target.value as any)} className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="ALL">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary-600">Assignee</label>
              <select value={ticketAssignee} onChange={e=>setTicketAssignee(e.target.value as any)} className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="ALL">All</option>
                <option value="UNASSIGNED">Unassigned</option>
                {users.map(u => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-secondary-600">Showing {filteredTickets.length} of {tickets.length} tickets</div>
            <button onClick={clearFilters} className="text-xs text-secondary-800 hover:underline">Clear filters</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-secondary-50 text-left text-secondary-600">
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Description</th>
                <th className="p-2 font-medium">Assignee</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Category</th>
                <th className="p-2 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                  <td className="p-2 font-medium whitespace-nowrap"><a href={`/tickets/${t.id}`} className="text-primary-600 hover:underline">{t.title}</a></td>
                  <td className="p-2 max-w-[24rem] truncate">{t.description || ""}</td>
                  <td className="p-2 whitespace-nowrap">
                    <select defaultValue={t.assigneeId || ''} onChange={(e) => updateTicketAssignee(t.id, e.target.value)} className="rounded-lg border border-secondary-300 px-2 py-1">
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
                  <td className="p-2 whitespace-nowrap">
                    {(() => { const p = ((t as any).priority as 'LOW'|'MEDIUM'|'HIGH'|undefined) || 'MEDIUM'; const cls = p==='HIGH'?'bg-danger-100 text-danger-700':p==='MEDIUM'?'bg-warning-100 text-warning-700':'bg-success-100 text-success-700'; const label = p.charAt(0)+p.slice(1).toLowerCase(); return (<span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>); })()}
                  </td>
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


