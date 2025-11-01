import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { id: ticketId } = await params;
    const history = await prisma.ticketHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    // If assignee changes are recorded as user IDs, resolve them to names/emails for display
    const assigneeIds = new Set<string>();
    for (const h of history) {
      if (h.field === 'assignee') {
        if (h.oldValue) assigneeIds.add(h.oldValue);
        if (h.newValue) assigneeIds.add(h.newValue);
      }
    }
    let idToLabel: Record<string, string> = {};
    if (assigneeIds.size > 0) {
      const users = await prisma.user.findMany({ where: { id: { in: Array.from(assigneeIds) } } });
      idToLabel = Object.fromEntries(users.map(u => [u.id, u.name || u.email]));
    }
    const transformed = history.map(h => {
      if (h.field !== 'assignee') return h;
      return {
        ...h,
        oldValue: h.oldValue ? (idToLabel[h.oldValue] || h.oldValue) : h.oldValue,
        newValue: h.newValue ? (idToLabel[h.newValue] || h.newValue) : h.newValue,
      };
    });
    return NextResponse.json({ history: transformed });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
