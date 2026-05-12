import { z } from 'zod';

export const opportunitySchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  value: z.coerce.number().min(0),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  probability: z.coerce.number().min(0).max(100),
  closeDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  assignedToId: z.string().optional().or(z.literal('')),
});

export type OpportunityInput = z.infer<typeof opportunitySchema>;
