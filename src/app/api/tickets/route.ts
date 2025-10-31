import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const tickets = await prisma.ticket.findMany({
      where: { tenantId: me?.tenantId || undefined, ...(categoryId ? { categoryId } : {}) },
      orderBy: { createdAt: 'asc' },
      include: { category: true, assignee: true },
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    if (!me?.tenantId) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

    const body = await request.json();
    const { title, description, status, categoryId, assigneeId } = body ?? {};
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description ?? null,
        status: status ?? 'TODO',
        categoryId,
        assigneeId: assigneeId ?? null,
        tenantId: me.tenantId,
      },
      include: { category: true },
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
