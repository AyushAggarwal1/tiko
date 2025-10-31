"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; parentId?: string | null; ticketsCount?: number };

type Ticket = { id: string; title: string; description?: string | null; status: "TODO"|"IN_PROGRESS"|"DONE"; categoryId: string; category?: { id: string; name: string }; assigneeId?: string | null; assignee?: User | null };

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

export default function Dashboard() {
  const router = useRouter();
  const [active, setActive] = useState<'categories' | 'tickets' | 'users'>('categories');

  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentId, setParentId] = useState<string | "">("");

  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [ticketCategoryId, setTicketCategoryId] = useState<string | "">("");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [userError, setUserError] = useState<string | null>(null);

  // Ticket filters
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"ALL" | Ticket["status"]>("ALL");
  const [ticketCategory, setTicketCategory] = useState<string | "">("");

  const tree = useMemo(() => buildTree(categories), [categories]);
  const categoryOptions = useMemo(() => buildOptions(tree), [tree]);
  const stats = useMemo(() => ({ categories: categories.length, tickets: tickets.length, users: users.length }), [categories.length, tickets.length, users.length]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesQuery = ticketQuery.trim().length === 0 || t.title.toLowerCase().includes(ticketQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(ticketQuery.toLowerCase());
      const matchesStatus = ticketStatus === 'ALL' || t.status === ticketStatus;
      const matchesCategory = !ticketCategory || t.categoryId === ticketCategory;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [tickets, ticketQuery, ticketStatus, ticketCategory]);

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

  useEffect(() => { loadCategories(); loadTickets(); }, []);
  useEffect(() => { if (active === 'users' || active === 'tickets') loadUsers(); }, [active]);

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategoryName, parentId: parentId || null }) });
    if (res.ok) { setNewCategoryName(""); setParentId(""); loadCategories(); }
  }
  async function createTicket() {
    if (!newTicketTitle.trim() || !ticketCategoryId) return;
    const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTicketTitle, description: newTicketDesc, categoryId: ticketCategoryId }) });
    if (res.ok) { setNewTicketTitle(""); setNewTicketDesc(""); setTicketCategoryId(""); loadTickets(); }
  }
  async function updateTicketStatus(id: string, status: Ticket["status"]) {
    const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) loadTickets();
  }
  async function updateTicketAssignee(id: string, assigneeId: string | "") {
    const res = await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId: assigneeId || null }) });
    if (res.ok) loadTickets();
  }
  async function createUser() {
    setUserError(null);
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, password }) });
    if (!res.ok) { const d = await res.json(); setUserError(d?.error ?? 'Failed'); return; }
    setEmail(''); setName(''); setPassword(''); loadUsers();
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }

  function Tree({ nodes }: { nodes: TreeNode[] }) {
    return (
      <ul className="space-y-1">
        {nodes.map((n) => (
          <li key={n.id}>
            <a href={`/categories/${n.id}`} className="px-2 py-1 rounded inline-block text-primary-600 hover:underline">{n.name} <span className="text-secondary-500">({(n as any).ticketsCount ?? 0})</span></a>
            {n.children.length > 0 && (<div className="ml-4 mt-1 border-l pl-3"><Tree nodes={n.children} /></div>)}
          </li>
        ))}
      </ul>
    );
  }

  function StatusBadge({ status }: { status: Ticket['status'] }) {
    const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
    const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      {/* Header removed; global fixed header in layout */}

      <nav className="rounded-xl bg-white p-2 shadow">
        <div className="flex items-center gap-2">
          {[
            { key: 'categories', label: 'Categories' },
            { key: 'tickets', label: 'Tickets' },
            { key: 'users', label: 'Users' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${active === tab.key ? 'bg-primary-600 text-white' : 'text-secondary-800 hover:bg-secondary-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

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

      {active === 'categories' && (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Category tree</h2>
            <Tree nodes={tree} />
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Create category / sub-category</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Name" />
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="">Root (no parent)</option>
                {categoryOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
            </div>
            <button onClick={createCategory} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Create</button>
          </div>
        </section>
      )}

      {active === 'tickets' && (
        <>
          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Create ticket</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Title (required)" />
              <select value={ticketCategoryId} onChange={(e) => setTicketCategoryId(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="">Select category/sub-category</option>
                {categoryOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
              <input value={newTicketDesc} onChange={(e) => setNewTicketDesc(e.target.value)} className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 md:col-span-2" placeholder="Description (optional)" />
            </div>
            <button onClick={createTicket} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Create ticket</button>
          </section>

          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">All tickets</h2>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={ticketQuery}
                onChange={e=>setTicketQuery(e.target.value)}
                placeholder="Search title or description"
                className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <select
                value={ticketStatus}
                onChange={e=>setTicketStatus(e.target.value as any)}
                className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="ALL">All status</option>
                <option value="TODO">To-do</option>
                <option value="IN_PROGRESS">In-progress</option>
                <option value="DONE">Done</option>
              </select>
              <select
                value={ticketCategory}
                onChange={e=>setTicketCategory(e.target.value)}
                className="rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">All categories</option>
                {categoryOptions.map(o => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-secondary-50/60">
                      <td className="p-2 font-medium whitespace-nowrap"><a href={`/tickets/${t.id}`} className="text-primary-600 hover:underline">{t.title}</a></td>
                      <td className="p-2 max-w-[24rem] truncate">{t.description || ""}</td>
                      <td className="p-2 whitespace-nowrap">
                        <select value={t.assigneeId || ''} onChange={(e) => updateTicketAssignee(t.id, e.target.value)} className="rounded-lg border border-secondary-300 px-2 py-1">
                          <option value="">Unassigned</option>
                          {users.map(u => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
                        </select>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={t.status} />
                          <select value={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value as Ticket["status"])} className="rounded-lg border border-secondary-300 px-2 py-1">
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
        </>
      )}

      {active === 'users' && (
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
              {userError && <span className="text-danger-600 text-sm">{userError}</span>}
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">All users</h2>
            <ul className="divide-y">
              {users.map(u => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <div><p className="font-medium">{u.email}</p>{u.name && <p className="text-sm text-secondary-600">{u.name}</p>}</div>
                  <span className="text-xs text-secondary-500">{u.id.slice(0,8)}</span>
                </li>
              ))}
              {users.length === 0 && <li className="py-2 text-center text-sm text-secondary-600">No users yet.</li>}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
