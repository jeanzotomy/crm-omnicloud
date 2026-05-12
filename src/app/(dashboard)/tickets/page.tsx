import Link from 'next/link';
import { Plus, Ticket, AlertCircle, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TicketQueue from '@/components/tickets/TicketQueue';

export const metadata = { title: 'Tickets — Support' };

async function getStats() {
  const [open, critical, pending, resolved] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'NEW'] } } }),
    prisma.ticket.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({ where: { status: 'PENDING' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
  ]);
  return { open, critical, pending, resolved };
}

export default async function TicketsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const stats = await getStats();

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">File de tickets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez et suivez toutes les demandes de support</p>
          </div>
          <Link
            href="/tickets/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nouveau ticket
          </Link>
        </div>

        {/* KPI strip */}
        <div className="flex items-center gap-4 mt-5 pt-5 border-t border-gray-100">
          <StatPill icon={Inbox} label="Ouverts" value={stats.open} color="indigo" />
          <div className="h-4 w-px bg-gray-200" />
          <StatPill icon={AlertCircle} label="Critiques" value={stats.critical} color="red" />
          <div className="h-4 w-px bg-gray-200" />
          <StatPill icon={Clock} label="En attente" value={stats.pending} color="amber" />
          <div className="h-4 w-px bg-gray-200" />
          <StatPill icon={CheckCircle2} label="Résolus ce mois" value={stats.resolved} color="emerald" />
        </div>
      </div>

      <div className="p-6">
        <TicketQueue />
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'indigo' | 'red' | 'amber' | 'emerald';
}) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
