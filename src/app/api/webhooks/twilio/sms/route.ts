import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChannelType, InteractionDirection, TicketSource, TicketStatus } from '@prisma/client';
import crypto from 'crypto';

function verifyTwilioSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.TWILIO_AUTH_TOKEN;
  if (!secret) return false;

  const url = process.env.TWILIO_WEBHOOK_URL ?? req.url;
  const params = new URLSearchParams(body);
  const sortedParams = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('');

  const signature = crypto
    .createHmac('sha1', secret)
    .update(url + sortedParams)
    .digest('base64');

  return signature === req.headers.get('x-twilio-signature');
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  if (process.env.NODE_ENV === 'production' && !verifyTwilioSignature(req, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const from = params.get('From') ?? '';
  const to = params.get('To') ?? '';
  const messageBody = params.get('Body') ?? '';
  const messageSid = params.get('MessageSid') ?? '';

  if (!from || !messageBody) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Resolve default org (first org or env override)
  const defaultOrgId = process.env.DEFAULT_ORG_ID;
  const org = defaultOrgId
    ? await prisma.organization.findUnique({ where: { id: defaultOrgId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!org) {
    return NextResponse.json({ error: 'No organization configured' }, { status: 500 });
  }

  // Find or create a contact by phone number
  const normalizedPhone = from.replace(/\s/g, '');
  let contact = await prisma.contact.findFirst({
    where: { phone: normalizedPhone, organizationId: org.id },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        firstName: 'SMS',
        lastName: normalizedPhone,
        phone: normalizedPhone,
        organizationId: org.id,
      },
    });
  }

  // Check for existing open ticket from this number (within 24h)
  const recentTicket = await prisma.ticket.findFirst({
    where: {
      contactId: contact.id,
      source: TicketSource.SMS,
      status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  });

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!systemUser) {
    return NextResponse.json({ error: 'No system user' }, { status: 500 });
  }

  let ticket = recentTicket;
  if (!ticket) {
    const count = await prisma.ticket.count();
    ticket = await prisma.ticket.create({
      data: {
        number: `TKT-${String(count + 1).padStart(4, '0')}`,
        title: messageBody.slice(0, 100),
        description: messageBody,
        source: TicketSource.SMS,
        contactId: contact.id,
        organizationId: org.id,
        createdById: systemUser.id,
      },
    });
  }

  await prisma.omnichannelInteraction.create({
    data: {
      channel: ChannelType.SMS,
      direction: InteractionDirection.INBOUND,
      externalId: messageSid,
      from,
      to,
      body: messageBody,
      ticketId: ticket.id,
      organizationId: org.id,
    },
  });

  // Twilio expects TwiML response
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } },
  );
}
