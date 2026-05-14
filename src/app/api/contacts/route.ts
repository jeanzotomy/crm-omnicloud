import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams } from '@/lib/pagination';
import { contactSchema } from '@/lib/validations/contact';

const SORTABLE = new Set(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status']);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePaginationParams(sp);
  const search = sp.get('search') ?? '';
  const status = sp.get('status') ?? undefined;
  const companyId = sp.get('companyId') ?? undefined;
  const phone = sp.get('phone') ?? '';

  const [sortField = 'updatedAt', sortDir = 'desc'] = (sp.get('sort') ?? '').split(':');
  const orderBy = SORTABLE.has(sortField)
    ? { [sortField]: sortDir === 'asc' ? 'asc' as const : 'desc' as const }
    : { updatedAt: 'desc' as const };

  const where = {
    ...(search || phone ? {
      OR: [
        ...(search ? [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ] : []),
        ...(phone ? [{ phone: { contains: phone, mode: 'insensitive' as const } }] : []),
      ],
    } : {}),
    ...(status ? { status: status as 'LEAD' | 'PROSPECT' | 'CLIENT' | 'INACTIVE' } : {}),
    ...(companyId ? { companyId } : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ data: contacts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    title: parsed.data.title || null,
    notes: parsed.data.notes || null,
    companyId: parsed.data.companyId || null,
  };

  const contact = await prisma.contact.create({ data, include: { company: true } });
  return NextResponse.json(contact, { status: 201 });
}
