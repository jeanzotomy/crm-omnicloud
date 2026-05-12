import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { companySchema } from '@/lib/validations/company';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        _count: { select: { contacts: true, opportunities: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({ companies, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const company = await prisma.company.create({ data });
  return NextResponse.json(company, { status: 201 });
}
