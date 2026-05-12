import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TicketEditForm from '@/components/tickets/TicketEditForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const [ticket, teams, departments, contacts, companies, slas, agents] = await Promise.all([
    prisma.ticket.findUnique({ where: { id } }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.contact.findMany({ orderBy: { firstName: 'asc' }, select: { id: true, firstName: true, lastName: true } }),
    prisma.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.sLAPolicy.findMany({ orderBy: { priority: 'asc' }, select: { id: true, name: true, priority: true } }),
    prisma.user.findMany({ where: { role: { in: ['AGENT', 'MANAGER', 'ADMIN'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!ticket) notFound();

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/tickets/${id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-mono text-sm text-gray-400">{ticket.number}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Modifier le ticket</h1>
      </div>
      <div className="p-8 max-w-3xl">
        <TicketEditForm ticket={ticket} teams={teams} departments={departments} contacts={contacts} companies={companies} slas={slas} agents={agents} />
      </div>
    </div>
  );
}
