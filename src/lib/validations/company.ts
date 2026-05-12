import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  industry: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  size: z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE']).optional(),
  revenue: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
});

export type CompanyInput = z.infer<typeof companySchema>;
