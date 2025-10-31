"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category?: { id: string; name: string };
  assigneeId?: string | null;
  assignee?: { id: string; email: string; name?: string | null } | null;
};

type Comment = { id: string; body: string; createdAt: string };

type History = { id: string; field: string; oldValue?: string | null; newValue?: string | null; createdAt: string };

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

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Page header removed; using global header */}

      {!ticket ? (
        <p className="text-secondary-600">Loading...</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-white p-4 shadow">
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
                <button onClick={saveMeta} className="ml-auto rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700">Save</button>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-xl bg-white p-4 shadow">
            <h3 className="mb-2 font-semibold">Change history</h3>
            <ul className="space-y-2">
              {history.map(h => (
                <li key={h.id} className="rounded bg-secondary-50 p-2 text-sm">
                  <span className="font-medium">{h.field}</span>: "{h.oldValue ?? ''}" → "{h.newValue ?? ''}"
                  <span className="ml-2 text-xs text-secondary-500">{new Date(h.createdAt).toLocaleString()}</span>
                </li>
              ))}
              {history.length === 0 && (
                <li className="text-sm text-secondary-600">No changes yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <h3 className="mb-2 font-semibold">Comments</h3>
            <ul className="mb-3 space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded border bg-secondary-50 p-2">
                  <p className="text-sm">{c.body}</p>
                  <p className="mt-1 text-xs text-secondary-500">{new Date(c.createdAt).toLocaleString()}</p>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-secondary-600">No comments yet.</li>
              )}
            </ul>
            <div className="flex gap-2">
              <input value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Add a comment" />
              <button onClick={addComment} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Post</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
