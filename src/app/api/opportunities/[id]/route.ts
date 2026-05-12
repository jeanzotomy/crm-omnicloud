import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { opportunitySchema } from '@/lib/validations/opportunity';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      contact: true,
      company: true,
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return opportunity
    ? NextResponse.json(opportunity)
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
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

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data,
    include: { contact: true, company: true, assignedTo: { select: { id: true, name: true } } },
  });
  return NextResponse.json(opportunity);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.opportunity.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
