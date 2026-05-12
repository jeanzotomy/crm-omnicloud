import { Users, Building2, TrendingUp, DollarSign } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { stageBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OpportunityStage } from '@prisma/client';

interface DashboardData {
  totalContacts: number;
  totalCompanies: number;
  totalOpportunities: number;
  pipelineValue: number;
  recentOpportunities: {
    id: string;
    title: string;
    value: number;
    stage: OpportunityStage;
    contact: { firstName: string; lastName: string } | null;
    company: { name: string } | null;
    updatedAt: string;
  }[];
  byStage: { stage: OpportunityStage; count: number; value: number }[];
}

async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboard();

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité commerciale"
        icon={TrendingUp}
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Contacts"
            value={data.totalContacts}
            icon={Users}
            description="Total dans le CRM"
          />
          <StatCard
            title="Entreprises"
            value={data.totalCompanies}
            icon={Building2}
            description="Comptes actifs"
          />
          <StatCard
            title="Opportunités"
            value={data.totalOpportunities}
            icon={TrendingUp}
            description="En cours de traitement"
          />
          <StatCard
            title="Pipeline"
            value={formatCurrency(data.pipelineValue)}
            icon={DollarSign}
            description="Valeur totale du pipeline"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-card border rounded-xl">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Opportunités récentes</h2>
            </div>
            <div className="divide-y">
              {data.recentOpportunities.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">Aucune opportunité pour l&apos;instant.</p>
              )}
              {data.recentOpportunities.map((opp) => {
                const badge = stageBadge(opp.stage);
                return (
                  <div key={opp.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{opp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : '—'}
                        {opp.company ? ` · ${opp.company.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <Badge label={badge.label} variant={badge.variant} />
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(opp.value)}</span>
                      <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(opp.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border rounded-xl">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Pipeline par étape</h2>
            </div>
            <div className="p-6 space-y-3">
              {data.byStage.map(({ stage, count, value }) => {
                const badge = stageBadge(stage);
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge label={badge.label} variant={badge.variant} />
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(value)}</span>
                  </div>
                );
              })}
              {data.byStage.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
