import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    const categoriesRaw = await prisma.category.findMany({
      where: { tenantId: me?.tenantId || undefined },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tickets: true } } },
    });
    const categories = categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      tenantId: c.tenantId,
      ticketsCount: c._count.tickets,
    }));
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    if (!me?.tenantId) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

    const body = await request.json();
    const { name, description, parentId } = body ?? {};
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name, description: description ?? null, parentId: parentId ?? null, tenantId: me.tenantId },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
