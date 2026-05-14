import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TicketPriority } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const policies = await prisma.sLAPolicy.findMany({
    orderBy: { priority: 'asc' },
    include: { _count: { select: { tickets: true } } },
  });

  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as Record<string, unknown>;
  const { name, priority, firstResponseMinutes, resolutionMinutes } = body;

  if (!name || !priority || !firstResponseMinutes || !resolutionMinutes) {
    return NextResponse.json({ error: 'name, priority, firstResponseMinutes et resolutionMinutes sont requis' }, { status: 400 });
  }

  const policy = await prisma.sLAPolicy.create({
    data: {
      name: name as string,
      priority: priority as TicketPriority,
      firstResponseMinutes: Number(firstResponseMinutes),
      resolutionMinutes: Number(resolutionMinutes),
    },
  });

  return NextResponse.json(policy, { status: 201 });
}
