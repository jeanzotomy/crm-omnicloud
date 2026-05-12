import Link from 'next/link';
import { Users, Building2, TrendingUp, DollarSign, ArrowRight, Plus, Ticket, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { stageBadge, ticketStatusBadge, ticketPriorityBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const [
    totalContacts,
    totalCompanies,
    totalOpportunities,
    pipeline,
    openTickets,
    criticalTickets,
    resolvedToday,
    recentTickets,
    recentOpportunities,
    byStageRaw,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.company.count(),
    prisma.opportunity.count(),
    prisma.opportunity.aggregate({ _sum: { value: true } }),
    prisma.ticket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({
      where: { status: 'RESOLVED', resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      include: {
        assignee: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
      },
    }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _count: { _all: true },
      _sum: { value: true },
    }),
  ]);

  const byStage = byStageRaw.map((r) => ({ stage: r.stage, count: r._count._all, value: r._sum.value ?? 0 }));
  const pipelineValue = pipeline._sum.value ?? 0;
  const totalPipeline = byStage.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble — ITSM & CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tickets/new" className="flex items-center gap-2 rounded-xl border border-gray-200 text-gray-700 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Ticket className="h-4 w-4" /> Nouveau ticket
          </Link>
          <Link href="/opportunities/new" className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
            <Plus className="h-4 w-4" /> Nouvelle opportunité
          </Link>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Ticket KPIs */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Support ITSM</h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard title="Tickets ouverts" value={openTickets} icon={Ticket} description="En cours de traitement" color="amber" />
            <StatCard title="Critiques actifs" value={criticalTickets} icon={AlertCircle} description="Priorité critique" color="blue" />
            <StatCard title="Résolus aujourd'hui" value={resolvedToday} icon={CheckCircle} description="Clôturés ce jour" color="emerald" />
            <StatCard title="Pipeline CRM" value={formatCurrency(pipelineValue)} icon={DollarSign} description="Valeur consolidée" color="violet" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent open tickets */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Tickets ouverts — priorités</h2>
              <Link href="/tickets" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Voir tous <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentTickets.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun ticket ouvert. Excellent !</p>
                </div>
              )}
              {recentTickets.map((t) => {
                const sb = ticketStatusBadge(t.status);
                const pb = ticketPriorityBadge(t.priority);
                return (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors group">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{t.number}</span>
                        <Badge label={pb.label} variant={pb.variant} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate mt-0.5">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.assignee?.name ?? 'Non assigné'}</p>
                    </div>
                    <Badge label={sb.label} variant={sb.variant} dot />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pipeline by stage */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Pipeline CRM</h2>
              <Link href="/opportunities" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Voir <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {byStage.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucune donnée</p>}
              {byStage.map(({ stage, count, value }) => {
                const badge = stageBadge(stage);
                const pct = totalPipeline > 0 ? Math.round((value / totalPipeline) * 100) : 0;
                return (
                  <div key={stage} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge label={badge.label} variant={badge.variant} />
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">{formatCurrency(value)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPipeline > 0 && (
              <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total</span>
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(totalPipeline)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/tickets/new', label: 'Nouveau ticket', icon: Ticket, color: 'bg-amber-50 text-amber-600' },
            { href: '/contacts/new', label: 'Nouveau contact', icon: Users, color: 'bg-blue-50 text-blue-600' },
            { href: '/companies/new', label: 'Nouvelle entreprise', icon: Building2, color: 'bg-violet-50 text-violet-600' },
            { href: '/knowledge', label: 'Base de connaissances', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
              <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
