import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'user id is required' }, { status: 400 });
    if (id === auth.id) return NextResponse.json({ error: 'cannot remove yourself' }, { status: 400 });

    const me = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!me?.tenantId) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (user.tenantId !== me.tenantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}


