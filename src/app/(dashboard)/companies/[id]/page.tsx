import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Pencil } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import DeleteButton from '@/components/ui/DeleteButton';
import { stageBadge, statusBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ContactStatus, OpportunityStage, CompanySize } from '@prisma/client';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  size: CompanySize | null;
  revenue: number | null;
  contacts: { id: string; firstName: string; lastName: string; title: string | null; status: ContactStatus }[];
  opportunities: { id: string; title: string; value: number; stage: OpportunityStage }[];
  createdAt: string;
  updatedAt: string;
}

const SIZE_LABELS: Record<CompanySize, string> = {
  MICRO: 'Micro (< 10)',
  SMALL: 'Petite (10–49)',
  MEDIUM: 'Moyenne (50–249)',
  LARGE: 'Grande (250+)',
};

async function getCompany(id: string): Promise<Company | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/companies/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch company');
  return res.json();
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const pipelineValue = company.opportunities.reduce((sum, o) => sum + o.value, 0);

  return (
    <div>
      <PageHeader
        title={company.name}
        description={company.industry ?? undefined}
        icon={Building2}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/companies/${company.id}/edit`}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
            <DeleteButton id={company.id} entity="companies" redirectTo="/companies" />
          </div>
        }
      />

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Informations</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Info label="Site web" value={company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{company.website}</a> : undefined} />
              <Info label="Email" value={company.email} />
              <Info label="Téléphone" value={company.phone} />
              <Info label="Taille" value={company.size ? SIZE_LABELS[company.size] : undefined} />
              <Info label="Chiffre d'affaires" value={company.revenue ? formatCurrency(company.revenue) : undefined} />
              <Info label="Localisation" value={[company.city, company.country].filter(Boolean).join(', ') || undefined} />
              <Info label="Pipeline" value={<span className="font-semibold">{formatCurrency(pipelineValue)}</span>} />
              <Info label="Créé le" value={formatDate(company.createdAt)} />
            </dl>
          </div>

          <div className="bg-card border rounded-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Contacts ({company.contacts.length})</h2>
              <Link href={`/contacts/new?companyId=${company.id}`} className="text-xs text-primary hover:underline">
                Ajouter un contact
              </Link>
            </div>
            <div className="divide-y">
              {company.contacts.length === 0 && (
                <p className="px-6 py-6 text-sm text-muted-foreground text-center">Aucun contact lié.</p>
              )}
              {company.contacts.map((contact) => {
                const sb = statusBadge(contact.status);
                return (
                  <div key={contact.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/contacts/${contact.id}`} className="text-sm font-medium hover:underline">
                        {contact.firstName} {contact.lastName}
                      </Link>
                      {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                    </div>
                    <Badge label={sb.label} variant={sb.variant} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border rounded-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Opportunités ({company.opportunities.length})</h2>
              <Link href={`/opportunities/new?companyId=${company.id}`} className="text-xs text-primary hover:underline">
                Nouvelle opportunité
              </Link>
            </div>
            <div className="divide-y">
              {company.opportunities.length === 0 && (
                <p className="px-6 py-6 text-sm text-muted-foreground text-center">Aucune opportunité liée.</p>
              )}
              {company.opportunities.map((opp) => {
                const ob = stageBadge(opp.stage);
                return (
                  <div key={opp.id} className="px-6 py-3 flex items-center justify-between">
                    <Link href={`/opportunities/${opp.id}`} className="text-sm font-medium hover:underline">{opp.title}</Link>
                    <div className="flex items-center gap-3">
                      <Badge label={ob.label} variant={ob.variant} />
                      <span className="text-sm font-semibold">{formatCurrency(opp.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}
