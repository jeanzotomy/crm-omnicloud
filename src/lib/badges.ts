import type { OpportunityStage, ContactStatus, TicketStatus, TicketPriority, TicketType } from '@prisma/client';

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

export function ticketStatusBadge(status: TicketStatus): { label: string; variant: Variant } {
  const map: Record<TicketStatus, { label: string; variant: Variant }> = {
    NEW: { label: 'Nouveau', variant: 'info' },
    OPEN: { label: 'Ouvert', variant: 'warning' },
    PENDING: { label: 'En attente', variant: 'secondary' },
    ON_HOLD: { label: 'Suspendu', variant: 'secondary' },
    RESOLVED: { label: 'Résolu', variant: 'success' },
    CLOSED: { label: 'Fermé', variant: 'default' },
  };
  return map[status];
}

export function ticketPriorityBadge(priority: TicketPriority): { label: string; variant: Variant } {
  const map: Record<TicketPriority, { label: string; variant: Variant }> = {
    CRITICAL: { label: 'Critique', variant: 'danger' },
    HIGH: { label: 'Haute', variant: 'warning' },
    MEDIUM: { label: 'Moyenne', variant: 'info' },
    LOW: { label: 'Basse', variant: 'secondary' },
  };
  return map[priority];
}

export function ticketTypeBadge(type: TicketType): { label: string; variant: Variant } {
  const map: Record<TicketType, { label: string; variant: Variant }> = {
    INCIDENT: { label: 'Incident', variant: 'danger' },
    SERVICE_REQUEST: { label: 'Demande', variant: 'info' },
    PROBLEM: { label: 'Problème', variant: 'warning' },
    CHANGE: { label: 'Changement', variant: 'secondary' },
  };
  return map[type];
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
