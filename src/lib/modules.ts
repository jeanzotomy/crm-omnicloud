import { ModuleType } from '@prisma/client';

export interface ModuleDef {
  label: string;
  description: string;
  features: string[];
  color: string;
  available: boolean;
}

export const MODULE_DEFS: Record<ModuleType, ModuleDef> = {
  CRM: {
    label: 'CRM',
    description: 'Gestion des contacts, entreprises et pipeline commercial',
    features: ['Contacts & entreprises', 'Opportunités', 'Pipeline commercial'],
    color: 'indigo',
    available: true,
  },
  SUPPORT: {
    label: 'Support & ITSM',
    description: 'Gestion des tickets, SLA et base de connaissances',
    features: ['File de tickets', 'Politiques SLA', 'Base de connaissances', 'Rapports'],
    color: 'emerald',
    available: true,
  },
  CALL_CENTER: {
    label: 'Centre d\'appel',
    description: 'Bureau agent ACS/WebRTC, files d\'attente, IVR et tableau superviseur',
    features: ['Bureau agent ACS/WebRTC', 'Tableau superviseur temps réel', 'Files d\'attente & IVR', 'Transcription IA'],
    color: 'violet',
    available: true,
  },
  HR: {
    label: 'Ressources humaines',
    description: 'Gestion des employés, congés et paie',
    features: ['Registre employés', 'Gestion des congés', 'Module paie'],
    color: 'sky',
    available: false,
  },
  FINANCE: {
    label: 'Finance',
    description: 'Facturation, budget et suivi des dépenses',
    features: ['Factures & devis', 'Suivi budgétaire', 'Dépenses'],
    color: 'amber',
    available: false,
  },
  GED: {
    label: 'GED',
    description: 'Gestion électronique des documents et archivage',
    features: ['Stockage documentaire', 'Versioning', 'Partage sécurisé'],
    color: 'orange',
    available: false,
  },
  INTEGRATIONS: {
    label: 'Intégrations',
    description: 'Connecteurs API, webhooks et intégrations tierces',
    features: ['Clés API', 'Webhooks entrants/sortants', 'Connecteurs tiers'],
    color: 'rose',
    available: true,
  },
};

export const ALL_MODULES = Object.values(ModuleType);
