import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChannelType, InteractionDirection, TicketSource } from '@prisma/client';

// Accepts inbound email events from SendGrid Inbound Parse or Azure Communication Services
export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get('x-webhook-secret');
    if (sig !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    payload = (await req.json()) as Record<string, unknown>;
  } else {
    // SendGrid Inbound Parse sends multipart/form-data
    const form = await req.formData();
    payload = Object.fromEntries(form.entries()) as Record<string, unknown>;
  }

  const from = String(payload.from ?? payload.sender ?? '');
  const to = String(payload.to ?? payload.recipient ?? '');
  const subject = String(payload.subject ?? '(No subject)');
  const body = String(payload.text ?? payload.body ?? payload.html ?? '');
  const messageId = String(payload.message_id ?? payload['Message-ID'] ?? crypto.randomUUID());

  if (!from) {
    return NextResponse.json({ error: 'Missing sender' }, { status: 400 });
  }

  const defaultOrgId = process.env.DEFAULT_ORG_ID;
  const org = defaultOrgId
    ? await prisma.organization.findUnique({ where: { id: defaultOrgId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!org) {
    return NextResponse.json({ error: 'No organization configured' }, { status: 500 });
  }

  // Deduplicate: skip if this message was already processed
  const existing = await prisma.omnichannelInteraction.findFirst({
    where: { externalId: messageId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Find or create contact by email
  const senderEmail = from.match(/<(.+?)>/)?.[1] ?? from.trim();
  let contact = await prisma.contact.findFirst({
    where: { email: senderEmail, organizationId: org.id },
  });

  if (!contact) {
    const namePart = from.replace(/<.+>/, '').trim() || senderEmail;
    const [firstName, ...rest] = namePart.split(' ');
    contact = await prisma.contact.create({
      data: {
        firstName: firstName ?? 'Email',
        lastName: rest.join(' ') || senderEmail,
        email: senderEmail,
        organizationId: org.id,
      },
    });
  }

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!systemUser) {
    return NextResponse.json({ error: 'No system user' }, { status: 500 });
  }

  const count = await prisma.ticket.count();
  const ticket = await prisma.ticket.create({
    data: {
      number: `TKT-${String(count + 1).padStart(4, '0')}`,
      title: subject.slice(0, 200),
      description: body.slice(0, 5000),
      source: TicketSource.EMAIL,
      contactId: contact.id,
      organizationId: org.id,
      createdById: systemUser.id,
    },
  });

  await prisma.omnichannelInteraction.create({
    data: {
      channel: ChannelType.EMAIL,
      direction: InteractionDirection.INBOUND,
      externalId: messageId,
      from,
      to,
      body: body.slice(0, 5000),
      ticketId: ticket.id,
      organizationId: org.id,
    },
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
