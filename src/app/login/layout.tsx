import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (user) redirect('/dashboard');
  return <>{children}</>;
}


