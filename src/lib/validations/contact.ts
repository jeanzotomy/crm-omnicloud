import { z } from 'zod';

export const contactSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  title: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT', 'INACTIVE']),
  notes: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;
