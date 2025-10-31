import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    const users = await prisma.user.findMany({ where: { tenantId: me?.tenantId || undefined }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, organizationName } = body ?? {};
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 chars' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const auth = await getAuthUser();
    if (organizationName && typeof organizationName === 'string' && !auth) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: 'email already exists' }, { status: 409 });

      const { tenant, user } = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({ data: { name: organizationName } });
        const user = await tx.user.create({ data: { email, name: name ?? null, passwordHash, tenantId: tenant.id } });
        return { tenant, user };
      });
      return NextResponse.json({ user, tenant }, { status: 201 });
    }

    if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!me?.tenantId) return NextResponse.json({ error: 'no tenant' }, { status: 400 });

    const user = await prisma.user.create({ data: { email, name: name ?? null, passwordHash, tenantId: me.tenantId } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'email already exists', code: error.code }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user', code: error?.code, message: error?.message }, { status: 500 });
  }
}
