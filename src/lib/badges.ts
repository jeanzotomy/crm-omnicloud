import type { OpportunityStage, ContactStatus } from '@prisma/client';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

export function stageBadge(stage: OpportunityStage): { label: string; variant: Variant } {
  const map: Record<OpportunityStage, { label: string; variant: Variant }> = {
    LEAD: { label: 'Lead', variant: 'secondary' },
    QUALIFIED: { label: 'Qualifié', variant: 'info' },
    PROPOSAL: { label: 'Proposition', variant: 'warning' },
    NEGOTIATION: { label: 'Négociation', variant: 'warning' },
    WON: { label: 'Gagné', variant: 'success' },
    LOST: { label: 'Perdu', variant: 'danger' },
  };
  return map[stage];
}

export function statusBadge(status: ContactStatus): { label: string; variant: Variant } {
  const map: Record<ContactStatus, { label: string; variant: Variant }> = {
    LEAD: { label: 'Lead', variant: 'secondary' },
    PROSPECT: { label: 'Prospect', variant: 'info' },
    CLIENT: { label: 'Client', variant: 'success' },
    INACTIVE: { label: 'Inactif', variant: 'danger' },
  };
  return map[status];
}
