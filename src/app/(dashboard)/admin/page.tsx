import { prisma } from '@/lib/prisma';
import { Users, ShieldCheck, Users2, BarChart3 } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
  const [userCount, slaCount, teamCount, ticketCount] = await Promise.all([
    prisma.user.count(),
    prisma.sLAPolicy.count(),
    prisma.team.count(),
    prisma.ticket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
  ]);
  return { userCount, slaCount, teamCount, ticketCount };
}

export default async function AdminPage() {
  const stats = await getStats();

  const cards = [
    {
      href: '/admin/users',
      icon: Users,
      label: 'Utilisateurs',
      value: stats.userCount,
      description: 'Comptes actifs',
      color: 'indigo',
    },
    {
      href: '/admin/sla',
      icon: ShieldCheck,
      label: 'Politiques SLA',
      value: stats.slaCount,
      description: 'Niveaux de service définis',
      color: 'emerald',
    },
    {
      href: '/admin/teams',
      icon: Users2,
      label: 'Équipes',
      value: stats.teamCount,
      description: 'Équipes support',
      color: 'violet',
    },
    {
      href: '/tickets',
      icon: BarChart3,
      label: 'Tickets actifs',
      value: stats.ticketCount,
      description: 'Non résolus',
      color: 'amber',
    },
  ] as const;

  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100 hover:border-indigo-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100 hover:border-violet-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100 hover:border-amber-300' },
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {cards.map(({ href, icon: Icon, label, value, description, color }) => {
          const c = colorMap[color];
          return (
            <Link
              key={href}
              href={href}
              className={`group rounded-2xl border-2 ${c.border} bg-white p-6 transition-all hover:shadow-md`}
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.text}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
