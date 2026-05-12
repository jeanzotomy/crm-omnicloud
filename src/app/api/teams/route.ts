import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: {
      lead: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { members: true, tickets: true } },
    },
  });

  return NextResponse.json(teams);
}
