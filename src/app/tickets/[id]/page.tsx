"use client";

import { useEffect, useState } from 'react';
import CreateTicketModal from '@/app/_components/CreateTicketModal';
import CreateCategoryModal from '@/app/_components/CreateCategoryModal';
import { useParams, useRouter } from 'next/navigation';

type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW'|'MEDIUM'|'HIGH';
  category?: { id: string; name: string };
  assigneeId?: string | null;
  assignee?: { id: string; email: string; name?: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

type Comment = { id: string; body: string; createdAt: string; user?: { id: string; email: string; name?: string | null } };

type History = { id: string; field: string; oldValue?: string | null; newValue?: string | null; createdAt: string; user?: { id: string; email: string; name?: string | null } };

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string | null }>>([]);
  const [history, setHistory] = useState<History[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  async function load() {
    const [t, c, h, u] = await Promise.all([
      fetch(`/api/tickets/${id}`).then(r=>r.json()),
      fetch(`/api/tickets/${id}/comments`).then(r=>r.json()),
      fetch(`/api/tickets/${id}/history`).then(r=>r.json()),
      fetch('/api/users').then(r=>r.json()),
    ]);
    const tk = t.ticket ?? null;
    setTicket(tk);
    setComments(c.comments ?? []);
    setHistory(h.history ?? []);
    setUsers(u.users ?? []);
    if (tk) {
      setTitle(tk.title);
      setDescription(tk.description || '');
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function updateStatus(status: Ticket['status']) {
    if (!ticket) return;
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function saveMeta() {
    if (!ticket) return;
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (res.ok) load();
  }

  async function addComment() {
    if (!newComment.trim() || !ticket) return;
    const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment }),
    });
    if (res.ok) {
      setNewComment('');
      load();
    }
  }

  async function updateAssignee(assigneeId: string | "") {
    if (!ticket) return;
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: assigneeId || null }),
    });
    if (res.ok) load();
  }

  function StatusBadge({ status }: { status: Ticket['status'] }) {
    const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
    const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  function PriorityBadge({ priority }: { priority: Ticket['priority'] }) {
    const cls = priority === 'HIGH' ? 'bg-danger-100 text-danger-700' : priority === 'MEDIUM' ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700';
    const label = priority.charAt(0) + priority.slice(1).toLowerCase();
    return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  }

  async function copyIdToClipboard() {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.id);
    } catch {}
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 grid grid-cols-1 gap-6">
      {!ticket ? (
        <p className="text-secondary-600">Loading...</p>
      ) : (
        <>
          {/* Header */}
          <section className="rounded-xl bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-sm text-secondary-600"><a href="/tickets" className="hover:underline">Tickets</a> <span className="text-secondary-400">/</span> <span>{ticket.title || ticket.id.slice(0,8)}</span></div>
                <h1 className="text-xl font-semibold">Ticket details</h1>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => setShowCreateCategory(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-primary-700 ring-2 ring-primary-200 transition hover:bg-primary-100 focus:outline-none focus:ring-4 focus:ring-primary-300">New category</button>
                <button onClick={() => setShowCreateTicket(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-white shadow-md shadow-primary-300 ring-2 ring-primary-200 transition hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300">New ticket</button>
                {ticket.category?.id && (<a href={`/categories/${ticket.category.id}`} className="rounded-lg px-3 py-2 text-secondary-800 hover:bg-secondary-100">Open Category</a>)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-secondary-600 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="text-secondary-700">ID:</span>
                <span className="font-mono">{ticket.id.slice(0,8)}…</span>
                <button onClick={copyIdToClipboard} className="rounded px-2 py-1 hover:bg-secondary-100">Copy</button>
              </div>
              <div>
                <span className="text-secondary-700">Created:</span> {new Date(ticket.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="text-secondary-700">Updated:</span> {new Date(ticket.updatedAt).toLocaleString()}
              </div>
            </div>
          </section>

          {showCreateTicket && (
            <CreateTicketModal
              open={showCreateTicket}
              onClose={() => setShowCreateTicket(false)}
              defaultCategoryId={ticket.category?.id}
              onCreated={() => { setShowCreateTicket(false); }}
            />
          )}
          {showCreateCategory && (
            <CreateCategoryModal
              open={showCreateCategory}
              onClose={() => setShowCreateCategory(false)}
              defaultParentId={ticket.category?.id}
              onCreated={() => { setShowCreateCategory(false); }}
            />
          )}

          {/* Meta and controls */}
          <section className="rounded-xl bg-white p-4 shadow">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-secondary-600">Title</label>
                <input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              </div>
              <div>
                <label className="text-sm text-secondary-600">Description</label>
                <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-1 w-full min-h-[120px] rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600">Status:</span>
                  <StatusBadge status={ticket.status} />
                  <select value={ticket.status} onChange={(e)=>updateStatus(e.target.value as Ticket['status'])} className="rounded-lg border border-secondary-300 px-2 py-1">
                    <option value="TODO">To-do</option>
                    <option value="IN_PROGRESS">In-progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600">Category:</span>
                  <a href={`/categories/${ticket.category?.id}`} className="text-primary-600 hover:underline">{ticket.category?.name || ''}</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600">Assignee:</span>
                  <select value={ticket.assigneeId || ''} onChange={(e)=>updateAssignee(e.target.value)} className="rounded-lg border border-secondary-300 px-2 py-1">
                    <option value="">Unassigned</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600">Priority:</span>
                  <PriorityBadge priority={ticket.priority} />
                  <select value={ticket.priority} onChange={async (e)=>{
                    const val = e.target.value as Ticket['priority'];
                    await fetch(`/api/tickets/${ticket.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority: val }) });
                    load();
                  }} className="rounded-lg border border-secondary-300 px-2 py-1">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <button onClick={saveMeta} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-white shadow-md shadow-primary-300 ring-2 ring-primary-200 transition hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300">Save changes</button>
              </div>
            </div>
          </section>

          {/* 2-column: comments and history */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
              <h3 className="mb-2 font-semibold">Comments</h3>
              <ul className="mb-3 space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded border bg-secondary-50 p-2">
                  <p className="text-sm">{c.body}</p>
                  <p className="mt-1 text-xs text-secondary-500">{new Date(c.createdAt).toLocaleString()} {c.user && (<span className="text-secondary-600">• by {c.user.name || c.user.email}</span>)}</p>
                </li>
              ))}
                {comments.length === 0 && (
                  <li className="text-sm text-secondary-600">No comments yet.</li>
                )}
              </ul>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e)=>setNewComment(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComment(); }}
                  className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Add a comment (Ctrl/Cmd + Enter to post)"
                />
                <button onClick={addComment} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Post</button>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <h3 className="mb-2 font-semibold">Ticket History</h3>
            <ul className="space-y-2">
                {history.map(h => (
                  <li key={h.id} className="rounded bg-secondary-50 p-2 text-sm">
                  <span className="font-medium">{h.field}</span>: "{h.oldValue ?? ''}" → "{h.newValue ?? ''}"
                  <span className="ml-2 text-xs text-secondary-500">{new Date(h.createdAt).toLocaleString()}</span>
                  {h.user && (
                    <span className="ml-2 text-xs text-secondary-600">by {h.user.name || h.user.email}</span>
                  )}
                  </li>
                ))}
                {history.length === 0 && (
                  <li className="text-sm text-secondary-600">No changes yet.</li>
                )}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
