"use client";

import { useEffect, useMemo, useState } from 'react';

type Category = { id: string; name: string; parentId?: string | null };
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

export default function CreateTicketModal({ open, onClose, defaultCategoryId, onCreated }: {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  onCreated?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | ''>('');
  const [priority, setPriority] = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const options = useMemo(() => buildOptions(tree), [tree]);
  const titleValid = title.trim().length >= 2;
  const categoryValid = !!categoryId;

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.categories ?? []);
      } catch {}
    })();
  }, [open]);

  useEffect(() => {
    if (open) setCategoryId(defaultCategoryId || '');
  }, [open, defaultCategoryId]);

  async function createTicket() {
    if (!titleValid || !categoryValid || creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, categoryId, priority }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Failed to create ticket');
        return;
      }
      onCreated?.();
      onClose();
      setTitle(''); setDescription(''); setCategoryId(''); setPriority('MEDIUM');
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto mt-24 w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create ticket</h3>
          <button onClick={onClose} className="rounded px-2 py-1 text-secondary-700 hover:bg-secondary-100">✕</button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Title (required)" />
            <p className="mt-1 text-xs text-secondary-600">At least 2 characters.</p>
          </div>
          <div>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="">Select category/sub-category</option>
              {options.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
            </select>
            <p className="mt-1 text-xs text-secondary-600">Pick where this ticket belongs.</p>
          </div>
          <div className="md:col-span-2">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Description (optional)" />
            <p className="mt-1 text-xs text-secondary-600">Optional: add more details for context.</p>
          </div>
          <div>
            <select value={priority} onChange={(e)=>setPriority(e.target.value as any)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <p className="mt-1 text-xs text-secondary-600">Choose priority.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          {error && <span className="text-danger-600 text-sm">{error}</span>}
          <button onClick={() => { setTitle(''); setDescription(''); setCategoryId(''); setError(null); }} className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Reset</button>
          <button disabled={!titleValid || !categoryValid || creating} onClick={createTicket} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition focus:outline-none ${titleValid && categoryValid && !creating ? 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-300 ring-2 ring-primary-200 hover:shadow-lg focus:ring-4 focus:ring-primary-300' : 'bg-secondary-300 cursor-not-allowed'}`}>{creating ? 'Creating…' : 'Create ticket'}</button>
        </div>
      </div>
    </div>
  );
}


