import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations/contact';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      opportunities: { include: { company: true }, orderBy: { updatedAt: 'desc' } },
    },
  });

  return contact
    ? NextResponse.json(contact)
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
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

  const contact = await prisma.contact.update({ where: { id }, data, include: { company: true } });
  return NextResponse.json(contact);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
