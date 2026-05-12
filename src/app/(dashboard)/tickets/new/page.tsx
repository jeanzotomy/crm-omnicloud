import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TicketForm from '@/components/tickets/TicketForm';

export const metadata = { title: 'Nouveau ticket' };

export default async function NewTicketPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [teams, departments, contacts, companies, slas] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.contact.findMany({ orderBy: { firstName: 'asc' }, select: { id: true, firstName: true, lastName: true } }),
    prisma.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.sLAPolicy.findMany({ orderBy: { priority: 'asc' }, select: { id: true, name: true, priority: true } }),
  ]);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Nouveau ticket</h1>
        <p className="text-sm text-gray-500 mt-0.5">Créer une nouvelle demande de support</p>
      </div>
      <div className="p-8 max-w-3xl">
        <TicketForm teams={teams} departments={departments} contacts={contacts} companies={companies} slas={slas} />
      </div>
    </div>
  );
}
