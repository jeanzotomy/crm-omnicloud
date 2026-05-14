import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = { title: 'Administration — ServiceDesk Pro' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des utilisateurs, SLA et équipes</p>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
