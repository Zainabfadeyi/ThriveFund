import { env } from '../config/env';

interface Recipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: Recipient | Recipient[];
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const to = Array.isArray(options.to) ? options.to : [options.to];

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to,
      subject: options.subject,
      htmlContent: options.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error ${res.status}: ${body}`);
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

const BRAND_GREEN = '#00A86B';
const BRAND_DARK = '#0F172A';
const MUTED_TEXT = '#64748B';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(label: string, href: string, color = BRAND_GREEN) {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;margin:16px 0;padding:12px 24px;background:${color};color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
      ${escapeHtml(label)}
    </a>`;
}

export function passwordResetEmail(name: string, resetLink: string) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Reset your ThriveFund password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:${BRAND_DARK}">ThriveFund</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
        ${button('Reset Password', resetLink)}
        <p style="word-break:break-all;color:#555">${escapeHtml(resetLink)}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p style="color:${MUTED_TEXT};font-size:12px">ThriveFund · transparent payment operations</p>
      </div>`,
  };
}

export function invitationEmail(
  goalTitle: string,
  inviterName: string,
  contributionLink: string,
  message?: string,
  expectedAmount?: number,
) {
  const safeGoalTitle = escapeHtml(goalTitle);
  const safeInviterName = escapeHtml(inviterName);
  return {
    subject: `${inviterName} invited you to contribute to "${goalTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:${BRAND_DARK}">ThriveFund</h2>
        <p>Hi there,</p>
        <p><strong>${safeInviterName}</strong> has invited you to contribute to: <strong>${safeGoalTitle}</strong>.</p>
        ${expectedAmount ? `<p><strong>Amount:</strong> ₦${expectedAmount.toLocaleString()}</p>` : ''}
        ${message ? `<blockquote style="border-left:3px solid ${BRAND_GREEN};padding-left:12px;color:#555">${escapeHtml(message)}</blockquote>` : ''}
        ${button('View Contribution Details', contributionLink)}
        <p style="word-break:break-all;color:#555">${escapeHtml(contributionLink)}</p>
        <p style="color:${MUTED_TEXT};font-size:12px">ThriveFund · transparent payment operations</p>
      </div>`,
  };
}

export function paymentReceivedEmail(payerName: string, amount: number, goalTitle: string) {
  const safePayerName = escapeHtml(payerName);
  const safeGoalTitle = escapeHtml(goalTitle);
  return {
    subject: `Payment received: ₦${amount.toLocaleString()} for ${goalTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:${BRAND_DARK}">ThriveFund</h2>
        <p>Good news! A payment has been received and reconciled automatically.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Contributor</td><td style="padding:8px"><strong>${safePayerName}</strong></td></tr>
          <tr><td style="padding:8px;color:#666">Amount</td><td style="padding:8px"><strong>₦${amount.toLocaleString()}</strong></td></tr>
          <tr><td style="padding:8px;color:#666">Goal</td><td style="padding:8px"><strong>${safeGoalTitle}</strong></td></tr>
        </table>
        <p style="color:${MUTED_TEXT};font-size:12px">ThriveFund · transparent payment operations</p>
      </div>`,
  };
}

export async function sendPaymentReceivedEmail(
  to: string,
  data: { payerName: string; amount: number; goalTitle: string },
) {
  const template = paymentReceivedEmail(data.payerName, data.amount, data.goalTitle);
  await sendEmail({ to: { email: to }, subject: template.subject, html: template.html });
}
