import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const policy = await prisma.sLAPolicy.findUnique({ where: { id } });
  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(policy);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;
  const policy = await prisma.sLAPolicy.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name as string }),
      ...(body.firstResponseMinutes !== undefined && { firstResponseMinutes: Number(body.firstResponseMinutes) }),
      ...(body.resolutionMinutes !== undefined && { resolutionMinutes: Number(body.resolutionMinutes) }),
    },
  });

  return NextResponse.json(policy);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  await prisma.sLAPolicy.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
