import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { id } = await params;
    const categoryRaw = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { tickets: true } } } });
    if (!categoryRaw) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const tickets = await prisma.ticket.findMany({ where: { categoryId: id }, orderBy: { createdAt: 'desc' } });
    const category = {
      id: categoryRaw.id,
      name: categoryRaw.name,
      description: categoryRaw.description,
      parentId: categoryRaw.parentId,
      createdAt: categoryRaw.createdAt,
      updatedAt: categoryRaw.updatedAt,
      tenantId: categoryRaw.tenantId,
      ticketsCount: categoryRaw._count.tickets,
    };
    return NextResponse.json({ category, tickets });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { name, description, parentId } = body ?? {};
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
      },
    });
    return NextResponse.json({ category: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
