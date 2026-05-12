import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? 'support@yourdomain.com';
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

interface TicketEmailContext {
  ticketNumber: string;
  ticketId: string;
  ticketTitle: string;
  priority: string;
}

export async function sendTicketCreatedToAssignee(
  ctx: TicketEmailContext,
  assignee: { name: string | null; email: string },
) {
  const resend = getResend();
  if (!resend) return;
  const url = `${APP_URL}/tickets/${ctx.ticketId}`;
  await resend.emails.send({
    from: FROM,
    to: assignee.email,
    subject: `[${ctx.ticketNumber}] Nouveau ticket assigné — ${ctx.ticketTitle}`,
    html: emailTemplate({
      title: 'Nouveau ticket assigné',
      body: `Bonjour ${assignee.name ?? ''},<br><br>Le ticket <strong>${ctx.ticketNumber}</strong> vous a été assigné.<br><br><strong>${ctx.ticketTitle}</strong><br>Priorité : ${ctx.priority}`,
      ctaLabel: 'Voir le ticket',
      ctaUrl: url,
    }),
  });
}

export async function sendTicketCreatedToContact(
  ctx: TicketEmailContext,
  contact: { name: string; email: string },
) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: contact.email,
    subject: `Votre demande de support a été reçue — ${ctx.ticketNumber}`,
    html: emailTemplate({
      title: 'Demande reçue',
      body: `Bonjour ${contact.name},<br><br>Votre demande a bien été enregistrée sous la référence <strong>${ctx.ticketNumber}</strong>.<br><br><strong>${ctx.ticketTitle}</strong><br><br>Notre équipe vous répondra dans les meilleurs délais.`,
      ctaLabel: 'Suivre ma demande',
      ctaUrl: `${APP_URL}/tickets/${ctx.ticketId}`,
    }),
  });
}

export async function sendTicketStatusChanged(
  ctx: TicketEmailContext & { oldStatus: string; newStatus: string },
  assignee: { name: string | null; email: string },
) {
  const resend = getResend();
  if (!resend) return;
  const url = `${APP_URL}/tickets/${ctx.ticketId}`;
  await resend.emails.send({
    from: FROM,
    to: assignee.email,
    subject: `[${ctx.ticketNumber}] Statut changé → ${ctx.newStatus}`,
    html: emailTemplate({
      title: 'Statut mis à jour',
      body: `Le ticket <strong>${ctx.ticketNumber}</strong> a changé de statut.<br><br>${ctx.oldStatus} → <strong>${ctx.newStatus}</strong><br><br>${ctx.ticketTitle}`,
      ctaLabel: 'Voir le ticket',
      ctaUrl: url,
    }),
  });
}

export async function sendTicketAssigned(
  ctx: TicketEmailContext,
  assignee: { name: string | null; email: string },
) {
  const resend = getResend();
  if (!resend) return;
  await sendTicketCreatedToAssignee(ctx, assignee);
}

function emailTemplate({ title, body, ctaLabel, ctaUrl }: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Support CRM</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 16px;color:#111827;font-size:20px">${title}</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">${body}</p>
          <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">${ctaLabel}</a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6">
          <p style="margin:0;color:#9ca3af;font-size:12px">Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
