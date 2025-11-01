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

export default function CreateCategoryModal({ open, onClose, defaultParentId, onCreated }: {
  open: boolean;
  onClose: () => void;
  defaultParentId?: string;
  onCreated?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const options = useMemo(() => buildOptions(tree), [tree]);
  const parentLabel = useMemo(() => options.find(o => o.id === parentId)?.label || '', [options, parentId]);
  const pathPreview = useMemo(() => {
    const base = parentLabel ? parentLabel + ' / ' : '';
    const nm = name.trim() || '(new category)';
    return base + nm;
  }, [parentLabel, name]);
  const nameValid = name.trim().length >= 2;

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
    if (open) setParentId(defaultParentId || '');
  }, [open, defaultParentId]);

  async function createCategory() {
    if (!nameValid || creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null, parentId: parentId || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Failed to create category');
        return;
      }
      onCreated?.();
      onClose();
      setName(''); setDescription(''); setParentId('');
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
          <h3 className="text-lg font-semibold">Create category</h3>
          <button onClick={onClose} className="rounded px-2 py-1 text-secondary-700 hover:bg-secondary-100">✕</button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Name (required)" />
            <p className="mt-1 text-xs text-secondary-600">At least 2 characters.</p>
          </div>
          <div>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="">Root (no parent)</option>
              {options.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
            </select>
            <p className="mt-1 text-xs text-secondary-600">Choose a parent to create a sub-category.</p>
          </div>
          <div className="md:col-span-2">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" placeholder="Description (optional)" />
            <p className="mt-1 text-xs text-secondary-600">Optional: add a short description.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-secondary-700">Will be created at: <span className="font-medium text-secondary-900">{pathPreview}</span></div>
          <div className="flex items-center gap-2">
            {error && <span className="text-danger-600 text-sm">{error}</span>}
            <button onClick={() => { setName(''); setDescription(''); setParentId(''); setError(null); }} className="rounded-lg px-3 py-2 text-sm text-secondary-800 hover:bg-secondary-100">Reset</button>
            <button disabled={!nameValid || creating} onClick={createCategory} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-white transition focus:outline-none ${nameValid && !creating ? 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-300 ring-2 ring-primary-200 hover:shadow-lg focus:ring-4 focus:ring-primary-300' : 'bg-secondary-300 cursor-not-allowed'}`}>{creating ? 'Creating…' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


