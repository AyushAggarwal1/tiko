import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (user) redirect('/dashboard');
  return <>{children}</>;
}


