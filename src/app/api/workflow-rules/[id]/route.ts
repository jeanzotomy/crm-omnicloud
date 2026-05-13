import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowed = ['name', 'description', 'isActive', 'trigger', 'conditions', 'actions', 'order', 'stopOnMatch'];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const rule = await prisma.workflowRule.update({ where: { id }, data });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.workflowRule.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
