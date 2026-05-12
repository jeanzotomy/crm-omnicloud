import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import SessionProvider from '@/components/providers/SessionProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
