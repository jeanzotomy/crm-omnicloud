import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale = 'fr-CA') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' }).format(value);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(date));
}

export const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualifié',
  PROPOSAL: 'Proposition',
  NEGOTIATION: 'Négociation',
  WON: 'Gagné',
  LOST: 'Perdu',
};

export const STATUS_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CLIENT: 'Client',
  INACTIVE: 'Inactif',
};

export function isPast(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export const SIZE_LABELS: Record<string, string> = {
  MICRO: 'Micro (< 10)',
  SMALL: 'Petite (10–49)',
  MEDIUM: 'Moyenne (50–249)',
  LARGE: 'Grande (250+)',
};
