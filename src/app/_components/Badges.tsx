"use client";

export function StatusBadge({ status }: { status: 'TODO' | 'IN_PROGRESS' | 'DONE' }) {
  const cls = status === 'DONE' ? 'bg-success-100 text-success-700' : status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700';
  const label = status === 'DONE' ? 'Done' : status === 'IN_PROGRESS' ? 'In-progress' : 'To-do';
  return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

export function PriorityBadge({ priority }: { priority: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const cls = priority === 'HIGH' ? 'bg-danger-100 text-danger-700' : priority === 'MEDIUM' ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700';
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <span className={`inline-block rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}


