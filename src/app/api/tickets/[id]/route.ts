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
    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { category: true, assignee: true },
    });
    if (!ticket) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, assigneeId } = body ?? {};

    const prev = await prisma.ticket.findUnique({ where: { id } });
    if (!prev) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
      },
      include: { assignee: true },
    });

    const historyEntries: Array<{ field: string; oldValue?: string | null; newValue?: string | null }> = [];
    if (title && title !== prev.title) historyEntries.push({ field: 'title', oldValue: prev.title, newValue: title });
    if (description !== undefined && description !== prev.description) historyEntries.push({ field: 'description', oldValue: prev.description ?? null, newValue: description ?? null });
    if (status && status !== prev.status) historyEntries.push({ field: 'status', oldValue: prev.status, newValue: status });

    if (historyEntries.length > 0) {
      await prisma.ticketHistory.createMany({
        data: historyEntries.map(h => ({
          ticketId: id,
          userId: user.id,
          field: h.field,
          oldValue: h.oldValue ?? null,
          newValue: h.newValue ?? null,
        })),
      });
    }

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
