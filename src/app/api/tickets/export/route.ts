import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TicketStatus, TicketPriority, TicketType, TicketSource } from '@prisma/client';
import { PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/lib/labels';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const format = sp.get('format') ?? 'csv';
  const search = sp.get('search') ?? '';
  const status = sp.get('status') as TicketStatus | null;
  const priority = sp.get('priority') as TicketPriority | null;
  const type = sp.get('type') as TicketType | null;
  const source = sp.get('source') as TicketSource | null;
  const contactId = sp.get('contactId');
  const companyId = sp.get('companyId');
  const teamId = sp.get('teamId');
  const assigneeId = sp.get('assigneeId');
  const from = sp.get('from');
  const to = sp.get('to');
  const statuses = sp.get('statuses')?.split(',').filter(Boolean) as TicketStatus[] | undefined;
  const priorities = sp.get('priorities')?.split(',').filter(Boolean) as TicketPriority[] | undefined;

  const where = {
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { number: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(statuses?.length ? { status: { in: statuses } } : status ? { status } : {}),
    ...(priorities?.length ? { priority: { in: priorities } } : priority ? { priority } : {}),
    ...(type ? { type } : {}),
    ...(source ? { source } : {}),
    ...(contactId ? { contactId } : {}),
    ...(companyId ? { companyId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(from || to ? { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: {
      assignee: { select: { name: true, email: true } },
      contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
      company: { select: { name: true } },
      team: { select: { name: true } },
    },
  });

  const date = new Date().toISOString().slice(0, 10);

  if (format === 'pdf') {
    const rows = tickets.map((t) => `
      <tr>
        <td>${t.number}</td>
        <td>${escHtml(t.title)}</td>
        <td><span class="badge badge-${t.status.toLowerCase()}">${TICKET_STATUS_LABELS[t.status]}</span></td>
        <td>${PRIORITY_LABELS[t.priority]}</td>
        <td>${t.type}</td>
        <td>${t.source}</td>
        <td>${t.assignee?.name ?? '—'}</td>
        <td>${t.contact ? `${t.contact.firstName} ${t.contact.lastName}` : '—'}</td>
        <td>${t.company?.name ?? '—'}</td>
        <td>${t.createdAt.toISOString().slice(0, 10)}</td>
        <td>${t.resolvedAt?.toISOString().slice(0, 10) ?? '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Tickets — ${date}</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #111; }
  h1 { font-size: 14px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 8px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: #fff; padding: 4px 6px; text-align: left; font-size: 8px; }
  td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { padding: 1px 5px; border-radius: 3px; font-size: 7px; font-weight: bold; }
  .badge-new { background: #e0f2fe; color: #075985; }
  .badge-open { background: #dbeafe; color: #1e40af; }
  .badge-pending { background: #f3e8ff; color: #6b21a8; }
  .badge-on_hold { background: #fef3c7; color: #92400e; }
  .badge-resolved { background: #dcfce7; color: #166534; }
  .badge-closed { background: #f1f5f9; color: #475569; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<h1>Export Tickets</h1>
<div class="meta">Généré le ${date} · ${tickets.length} tickets</div>
<table>
  <thead>
    <tr>
      <th>N°</th><th>Titre</th><th>Statut</th><th>Priorité</th><th>Type</th>
      <th>Source</th><th>Assigné</th><th>Contact</th><th>Entreprise</th>
      <th>Créé le</th><th>Résolu le</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="tickets-${date}.html"`,
      },
    });
  }

  // CSV
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const headers = ['Numéro', 'Titre', 'Statut', 'Priorité', 'Type', 'Source', 'Assigné', 'Email assigné', 'Contact', 'Email contact', 'Téléphone', 'Entreprise', 'Équipe', 'Créé le', 'Résolu le'];
  const csvRows = tickets.map((t) => [
    t.number,
    escape(t.title),
    t.status,
    t.priority,
    t.type,
    t.source,
    escape(t.assignee?.name ?? ''),
    t.assignee?.email ?? '',
    t.contact ? escape(`${t.contact.firstName} ${t.contact.lastName}`) : '',
    t.contact?.email ?? '',
    t.contact?.phone ?? '',
    escape(t.company?.name ?? ''),
    escape(t.team?.name ?? ''),
    t.createdAt.toISOString().slice(0, 10),
    t.resolvedAt?.toISOString().slice(0, 10) ?? '',
  ]);

  const csv = '﻿' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tickets-${date}.csv"`,
    },
  });
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
