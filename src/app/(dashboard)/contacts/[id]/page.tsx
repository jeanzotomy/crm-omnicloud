import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Users, Pencil, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import DeleteButton from '@/components/ui/DeleteButton';
import { statusBadge, stageBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      opportunities: {
        select: { id: true, title: true, value: true, stage: true, closeDate: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!contact) notFound();

  const badge = statusBadge(contact.status);

  return (
    <div>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.title ?? undefined}
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
            <DeleteButton id={contact.id} entity="contacts" redirectTo="/contacts" />
          </div>
        }
      />

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Informations</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Info label="Email" value={contact.email} />
              <Info label="Téléphone" value={contact.phone} />
              <Info label="Entreprise" value={contact.company?.name} />
              <Info label="Statut" value={<Badge label={badge.label} variant={badge.variant} />} />
              <Info label="Créé le" value={formatDate(contact.createdAt.toISOString())} />
              <Info label="Mis à jour" value={formatDate(contact.updatedAt.toISOString())} />
            </dl>
            {contact.notes && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-1">Notes</dt>
                <dd className="text-sm whitespace-pre-wrap">{contact.notes}</dd>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Opportunités ({contact.opportunities.length})</h2>
              <Link
                href={`/opportunities/new?contactId=${contact.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Nouvelle opportunité
              </Link>
            </div>
            <div className="divide-y">
              {contact.opportunities.length === 0 && (
                <p className="px-6 py-6 text-sm text-muted-foreground text-center">Aucune opportunité liée.</p>
              )}
              {contact.opportunities.map((opp) => {
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}
