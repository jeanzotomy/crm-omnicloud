import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/modules';
import { ModuleType, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/modules — all modules for the current org with their enabled status
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = session.user.organizationId;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const rows = await prisma.organizationModule.findMany({
    where: { organizationId: orgId },
    select: { module: true, enabled: true, config: true, enabledAt: true },
  });

  const rowMap = new Map(rows.map(r => [r.module, r]));

  const result = ALL_MODULES.map(module => ({
    module,
    enabled: rowMap.get(module)?.enabled ?? false,
    config: rowMap.get(module)?.config ?? {},
    enabledAt: rowMap.get(module)?.enabledAt ?? null,
  }));

  return NextResponse.json(result);
}

const PatchSchema = z.object({
  module: z.nativeEnum(ModuleType),
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional(),
});

// PATCH /api/modules — enable/disable a module (upsert)
export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = session.user.organizationId;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const body = PatchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 422 });

  const { module, enabled, config } = body.data;

  const row = await prisma.organizationModule.upsert({
    where: { organizationId_module: { organizationId: orgId, module } },
    create: {
      organizationId: orgId,
      module,
      enabled,
      config: (config ?? {}) as Prisma.InputJsonValue,
      enabledById: session.user.id,
    },
    update: {
      enabled,
      ...(config !== undefined && { config: config as Prisma.InputJsonValue }),
      enabledById: session.user.id,
    },
    select: { module: true, enabled: true, config: true, enabledAt: true },
  });

  return NextResponse.json(row);
}
