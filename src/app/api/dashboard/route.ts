import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    totalContacts, totalCompanies, totalOpportunities,
    openOpportunities, wonOpportunities,
    recentOpportunities, pipeline,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.company.count(),
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { stage: { notIn: ['WON', 'LOST'] } } }),
    prisma.opportunity.count({ where: { stage: 'WON' } }),
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
      },
    }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _sum: { value: true },
      _count: true,
      where: { stage: { notIn: ['WON', 'LOST'] } },
    }),
  ]);

  const pipelineValue = pipeline.reduce((sum, s) => sum + (s._sum.value ?? 0), 0);

  return NextResponse.json({
    totalContacts,
    totalCompanies,
    totalOpportunities,
    openOpportunities,
    wonOpportunities,
    pipelineValue,
    recentOpportunities,
    pipeline,
  });
}
