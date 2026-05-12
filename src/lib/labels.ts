import type { TicketStatus, TicketPriority, TicketType, TicketSource } from '@prisma/client';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nouveau',
  OPEN: 'Ouvert',
  PENDING: 'En attente',
  ON_HOLD: 'Suspendu',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

export const TYPE_LABELS: Record<TicketType, string> = {
  INCIDENT: 'Incident',
  SERVICE_REQUEST: 'Demande de service',
  PROBLEM: 'Problème',
  CHANGE: 'Changement',
};

export const SOURCE_LABELS: Record<TicketSource, string> = {
  PORTAL: 'Portail',
  EMAIL: 'Email',
  PHONE: 'Téléphone',
  CHAT: 'Chat',
  API: 'API',
  SMS: 'SMS',
  TEAMS: 'Teams',
  WHATSAPP: 'WhatsApp',
};
