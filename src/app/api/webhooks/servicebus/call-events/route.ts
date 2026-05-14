import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChannelType, InteractionDirection, TicketSource } from '@prisma/client';

interface CallSummaryPayload {
  callId: string;
  callerNumber: string;
  callerName?: string;
  agentId?: string;
  channel?: string;
  startedAt?: string;
  answeredAt?: string;
  endedAt?: string;
  talkDurationSeconds?: number;
  fullTranscript?: string;
  overallSentiment?: string;
  sentimentScore?: number;
  aiSummary?: string;
  wrapUpCode?: string;
  wrapUpNotes?: string;
}

export async function POST(req: NextRequest) {
  const secret = process.env.SERVICEBUS_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get('x-servicebus-secret');
    if (sig !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const payload = await req.json() as CallSummaryPayload;
  const { callId, callerNumber, callerName, fullTranscript, aiSummary, overallSentiment, talkDurationSeconds } = payload;

  if (!callId || !callerNumber) {
    return NextResponse.json({ error: 'callId and callerNumber are required' }, { status: 400 });
  }

  const existing = await prisma.omnichannelInteraction.findFirst({
    where: { externalId: callId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const org = process.env.DEFAULT_ORG_ID
    ? await prisma.organization.findUnique({ where: { id: process.env.DEFAULT_ORG_ID } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!org) return NextResponse.json({ error: 'No organization configured' }, { status: 500 });

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!systemUser) return NextResponse.json({ error: 'No system user' }, { status: 500 });

  let contact = await prisma.contact.findFirst({
    where: { phone: callerNumber, organizationId: org.id },
  });
  if (!contact) {
    const nameParts = (callerName ?? callerNumber).split(' ');
    contact = await prisma.contact.create({
      data: {
        firstName: nameParts[0] ?? 'Unknown',
        lastName: nameParts.slice(1).join(' ') || callerNumber,
        phone: callerNumber,
        organizationId: org.id,
      },
    });
  }

  const count = await prisma.ticket.count();
  const durationMin = Math.ceil((talkDurationSeconds ?? 0) / 60);
  const ticketDescription = aiSummary
    ?? `Call from ${callerNumber}${callerName ? ` (${callerName})` : ''} — ${durationMin} min${overallSentiment ? `, sentiment: ${overallSentiment}` : ''}`;

  const ticket = await prisma.ticket.create({
    data: {
      number: `TKT-${String(count + 1).padStart(4, '0')}`,
      title: `Call from ${contact.firstName} ${contact.lastName}`,
      description: ticketDescription,
      source: TicketSource.PHONE,
      contactId: contact.id,
      organizationId: org.id,
      createdById: systemUser.id,
    },
  });

  const commentLines = [
    aiSummary && `**AI Summary:** ${aiSummary}`,
    overallSentiment && `**Sentiment:** ${overallSentiment}${payload.sentimentScore !== undefined ? ` (${Math.round(payload.sentimentScore * 100)}%)` : ''}`,
    `**Duration:** ${durationMin} min`,
    payload.wrapUpCode && `**Wrap-up:** ${payload.wrapUpCode}${payload.wrapUpNotes ? ` — ${payload.wrapUpNotes}` : ''}`,
    fullTranscript && `\n**Transcript:**\n\`\`\`\n${fullTranscript.slice(0, 4000)}\n\`\`\``,
  ].filter(Boolean);

  await Promise.all([
    prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: systemUser.id,
        body: commentLines.join('\n') || 'Voice call recorded.',
        isInternal: true,
      },
    }),
    prisma.omnichannelInteraction.create({
      data: {
        channel: ChannelType.VOICE,
        direction: InteractionDirection.INBOUND,
        externalId: callId,
        from: callerNumber,
        to: org.name,
        body: ticketDescription,
        ticketId: ticket.id,
        organizationId: org.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}
