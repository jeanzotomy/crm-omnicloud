import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { companySchema } from '@/lib/validations/company';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { lastName: 'asc' } },
      opportunities: {
        include: { contact: true, assignedTo: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  return company
    ? NextResponse.json(company)
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = {
    ...parsed.data,
    website: parsed.data.website || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    industry: parsed.data.industry || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    country: parsed.data.country || null,
    notes: parsed.data.notes || null,
    size: parsed.data.size ?? null,
    revenue: parsed.data.revenue ?? null,
  };

  const company = await prisma.company.update({ where: { id }, data });
  return NextResponse.json(company);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.company.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
