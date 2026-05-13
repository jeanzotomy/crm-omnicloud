import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { WorkflowTrigger } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await prisma.workflowRule.findMany({
    orderBy: [{ trigger: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    name?: string;
    description?: string;
    trigger?: WorkflowTrigger;
    conditions?: unknown;
    actions?: unknown;
    order?: number;
    stopOnMatch?: boolean;
  };

  if (!body.name || !body.trigger) {
    return NextResponse.json({ error: 'name and trigger are required' }, { status: 400 });
  }
  if (!Object.values(WorkflowTrigger).includes(body.trigger)) {
    return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 });
  }

  const rule = await prisma.workflowRule.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      trigger: body.trigger,
      conditions: (body.conditions ?? []) as object[],
      actions: (body.actions ?? []) as object[],
      order: body.order ?? 0,
      stopOnMatch: body.stopOnMatch ?? false,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
