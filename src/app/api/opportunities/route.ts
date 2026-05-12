import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { opportunitySchema } from '@/lib/validations/opportunity';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const stage = searchParams.get('stage') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const where = {
    ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    ...(stage && { stage: stage as 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' }),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return NextResponse.json({ data: opportunities, total, page, pageSize: limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = opportunitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = {
    ...parsed.data,
    closeDate: parsed.data.closeDate ? new Date(parsed.data.closeDate) : null,
    notes: parsed.data.notes || null,
    contactId: parsed.data.contactId || null,
    companyId: parsed.data.companyId || null,
    assignedToId: parsed.data.assignedToId || null,
  };

  const opportunity = await prisma.opportunity.create({
    data,
    include: { contact: true, company: true, assignedTo: { select: { id: true, name: true } } },
  });
  return NextResponse.json(opportunity, { status: 201 });
}
