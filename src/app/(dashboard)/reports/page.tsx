import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

export const metadata = { title: 'Rapports' };

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    breachedSLA,
    byStatus,
    byPriority,
    byAgent,
    satisfaction,
    topCats,
    crmStats,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: since30 } } }),
    prisma.ticket.count({ where: { slaBreached: true } }),
    prisma.ticket.groupBy({ by: ['status'], _count: { _all: true }, where: { createdAt: { gte: since30 } } }),
    prisma.ticket.groupBy({ by: ['priority'], _count: { _all: true }, where: { createdAt: { gte: since30 } } }),
    prisma.ticket.groupBy({ by: ['assigneeId'], _count: { _all: true }, where: { createdAt: { gte: since30 }, assigneeId: { not: null } }, orderBy: { _count: { assigneeId: 'desc' } }, take: 5 }),
    prisma.ticket.aggregate({ _avg: { satisfactionScore: true }, _count: { satisfactionScore: true }, where: { satisfactionScore: { not: null } } }),
    prisma.ticket.groupBy({ by: ['category'], _count: { _all: true }, where: { createdAt: { gte: since30 }, category: { not: null } }, orderBy: { _count: { category: 'desc' } }, take: 8 }),
    Promise.all([prisma.contact.count(), prisma.company.count(), prisma.opportunity.count()]),
  ]);

  const agentIds = byAgent.map((r) => r.assigneeId).filter(Boolean) as string[];
  const agents = await prisma.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } });
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name ?? 'Inconnu']));

  const statusLabels: Record<string, string> = { NEW: 'Nouveau', OPEN: 'Ouvert', PENDING: 'En attente', ON_HOLD: 'Suspendu', RESOLVED: 'Résolu', CLOSED: 'Fermé' };
  const priorityLabels: Record<string, string> = { CRITICAL: 'Critique', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' };
  const priorityColors: Record<string, string> = { CRITICAL: 'bg-red-500', HIGH: 'bg-orange-400', MEDIUM: 'bg-blue-400', LOW: 'bg-gray-300' };

  const totalByPriority = byPriority.reduce((s, r) => s + r._count._all, 0);
  const totalByStatus = byStatus.reduce((s, r) => s + r._count._all, 0);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Rapports & Analytiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tableau de bord des 30 derniers jours</p>
      </div>

      <div className="p-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard title="Tickets ouverts" value={openTickets} icon={AlertCircle} description="En cours de traitement" color="amber" />
          <StatCard title="Résolus (30j)" value={resolvedTickets} icon={CheckCircle} description="Ce mois-ci" color="emerald" />
          <StatCard title="SLA dépassés" value={breachedSLA} icon={Clock} description="Total historique" color="blue" />
          <StatCard title="Satisfaction" value={satisfaction._avg.satisfactionScore ? `${satisfaction._avg.satisfactionScore.toFixed(1)}/5` : 'N/A'} icon={TrendingUp} description={`${satisfaction._count.satisfactionScore} avis`} color="violet" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* By Priority */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" /> Tickets par priorité (30j)
            </h2>
            <div className="space-y-4">
              {byPriority.map((r) => {
                const pct = totalByPriority > 0 ? Math.round((r._count._all / totalByPriority) * 100) : 0;
                return (
                  <div key={r.priority} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{priorityLabels[r.priority] ?? r.priority}</span>
                      <span className="text-gray-500">{r._count._all} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${priorityColors[r.priority] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" /> Tickets par statut (30j)
            </h2>
            <div className="space-y-4">
              {byStatus.map((r) => {
                const pct = totalByStatus > 0 ? Math.round((r._count._all / totalByStatus) * 100) : 0;
                return (
                  <div key={r.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{statusLabels[r.status] ?? r.status}</span>
                      <span className="text-gray-500">{r._count._all} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" /> Top agents (30j)
            </h2>
            <div className="space-y-3">
              {byAgent.map((r, i) => (
                <div key={r.assigneeId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600">
                    {(agentMap[r.assigneeId ?? ''] ?? '?')[0]}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 truncate">{agentMap[r.assigneeId ?? ''] ?? 'Inconnu'}</span>
                  <span className="text-sm font-semibold text-gray-800">{r._count._all}</span>
                </div>
              ))}
              {byAgent.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>}
            </div>
          </div>
        </div>

        {/* Top categories */}
        {topCats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Catégories les plus fréquentes (30j)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topCats.map((r) => (
                <div key={r.category} className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-600">{r._count._all}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRM Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Résumé CRM</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Contacts', value: crmStats[0] },
              { label: 'Entreprises', value: crmStats[1] },
              { label: 'Opportunités', value: crmStats[2] },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 bg-indigo-50 rounded-xl">
                <p className="text-3xl font-bold text-indigo-600">{value}</p>
                <p className="text-sm text-indigo-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
