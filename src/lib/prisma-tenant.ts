import { PrismaClient } from '@prisma/client';

const TENANT_MODELS = ['Ticket', 'Contact', 'Company', 'Opportunity'] as const;

export function createTenantClient(organizationId: string): PrismaClient {
  const client = new PrismaClient();

  // @ts-expect-error $use is available at runtime via Prisma middleware
  client.$use(async (params: Parameters<Parameters<PrismaClient['$use']>[0]>[0], next: Parameters<Parameters<PrismaClient['$use']>[0]>[1]) => {
    const model = params.model as string | undefined;

    if (model && (TENANT_MODELS as readonly string[]).includes(model)) {
      if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'count') {
        params.args ??= {};
        params.args.where = { ...params.args.where, organizationId };
      }
      if (params.action === 'create') {
        params.args ??= {};
        params.args.data = { ...params.args.data, organizationId };
      }
      if (params.action === 'createMany') {
        params.args ??= {};
        params.args.data = (params.args.data as Record<string, unknown>[]).map(
          (d) => ({ ...d, organizationId }),
        );
      }
    }

    return next(params);
  });

  return client;
}
