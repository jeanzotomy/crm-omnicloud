import { prisma } from '@/lib/prisma';
import { WorkflowTrigger, TicketPriority, TicketStatus, TicketType, TicketSource } from '@prisma/client';

export type WorkflowCondition = {
  field: 'priority' | 'type' | 'source' | 'status' | 'category' | 'tags' | 'assigneeId' | 'teamId';
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'is_empty' | 'is_not_empty';
  value: string | string[];
};

export type WorkflowAction =
  | { type: 'set_priority'; priority: TicketPriority }
  | { type: 'set_status'; status: TicketStatus }
  | { type: 'assign_to'; assigneeId: string }
  | { type: 'assign_to_team'; teamId: string }
  | { type: 'add_tag'; tag: string }
  | { type: 'set_sla'; slaPolicyId: string }
  | { type: 'add_comment'; body: string; isInternal: boolean };

export type WorkflowTicketContext = {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  source: TicketSource;
  category: string | null;
  tags: string[];
  assigneeId: string | null;
  teamId: string | null;
};

function evalCondition(c: WorkflowCondition, t: WorkflowTicketContext): boolean {
  const raw = t[c.field as keyof WorkflowTicketContext];
  switch (c.operator) {
    case 'equals':        return raw === c.value;
    case 'not_equals':    return raw !== c.value;
    case 'contains':
      if (Array.isArray(raw)) return raw.includes(c.value as string);
      return typeof raw === 'string' && raw.includes(c.value as string);
    case 'in':
      return Array.isArray(c.value) && c.value.includes(raw as string);
    case 'is_empty':
      return raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0);
    case 'is_not_empty':
      return raw !== null && raw !== '' && !(Array.isArray(raw) && raw.length === 0);
    default:
      return false;
  }
}

export async function runWorkflows(
  trigger: WorkflowTrigger,
  ticket: WorkflowTicketContext,
  actorId: string,
): Promise<void> {
  const rules = await prisma.workflowRule.findMany({
    where: { trigger, isActive: true },
    orderBy: { order: 'asc' },
  });

  for (const rule of rules) {
    const conditions = rule.conditions as WorkflowCondition[];
    if (conditions.length > 0 && !conditions.every((c) => evalCondition(c, ticket))) continue;

    const actions = rule.actions as WorkflowAction[];
    const patch: Record<string, unknown> = {};

    for (const action of actions) {
      switch (action.type) {
        case 'set_priority':  patch.priority = action.priority; break;
        case 'set_status':    patch.status   = action.status;   break;
        case 'assign_to':     patch.assigneeId = action.assigneeId; break;
        case 'assign_to_team': patch.teamId  = action.teamId;   break;
        case 'set_sla':       patch.slaPolicyId = action.slaPolicyId; break;
        case 'add_tag':
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { tags: { push: action.tag } },
          });
          break;
        case 'add_comment':
          await prisma.ticketComment.create({
            data: {
              ticketId: ticket.id,
              authorId: actorId,
              body: action.body,
              isInternal: action.isInternal,
            },
          });
          break;
      }
    }

    if (Object.keys(patch).length > 0) {
      await prisma.ticket.update({ where: { id: ticket.id }, data: patch });
    }

    if (rule.stopOnMatch) break;
  }
}
