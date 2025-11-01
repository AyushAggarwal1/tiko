import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}


