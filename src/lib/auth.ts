import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export type AuthUser = {
  id: string;
  email: string;
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-me' : '');
  if (!secret) throw new Error('AUTH_SECRET not configured');
  return secret;
}

export async function signUserJwt(user: AuthUser) {
  const secret = encoder.encode(getSecret());
  const jwt = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return jwt;
}

export async function verifyJwt(token: string) {
  try {
    const secret = encoder.encode(getSecret());
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    if (!sub || !email) return null;
    return { id: sub, email } as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get('auth')?.value;
  if (!token) return null;
  return await verifyJwt(token);
}
