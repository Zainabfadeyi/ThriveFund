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
const BORDER = '#E2E8F0';

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

function money(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function appLayout(preheader: string, body: string) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:24px 0;font-family:Arial,sans-serif;color:${BRAND_DARK}">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER}">
                <div style="font-size:22px;font-weight:800;color:${BRAND_DARK}">ThriveFund</div>
                <div style="font-size:13px;color:${MUTED_TEXT};margin-top:4px">Transparent campaign collections and reconciliation</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">${body}</td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#F8FAFC;color:${MUTED_TEXT};font-size:12px;border-top:1px solid ${BORDER}">
                ThriveFund sends this email for account security, campaign collection, and reconciliation activity.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function detailsTable(rows: Array<[string, string]>) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;border:1px solid ${BORDER};border-radius:8px;overflow:hidden">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="padding:11px 12px;color:${MUTED_TEXT};border-bottom:1px solid ${BORDER};width:38%">${escapeHtml(label)}</td>
          <td style="padding:11px 12px;border-bottom:1px solid ${BORDER};font-weight:700">${escapeHtml(value)}</td>
        </tr>`).join('')}
    </table>`;
}

export function emailVerificationEmail(name: string, verificationLink: string, organizationName: string) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Verify your ThriveFund email',
    html: appLayout(
      'Verify your email address to finish setting up your ThriveFund organization portal.',
      `
        <p style="margin:0 0 12px">Hi ${safeName},</p>
        <p style="margin:0 0 12px">Welcome to ThriveFund. Please verify your email address so we can trust account activity and send campaign notifications to the right owner.</p>
        ${detailsTable([['Organization', organizationName]])}
        ${button('Verify Email', verificationLink)}
        <p style="word-break:break-all;color:${MUTED_TEXT};font-size:12px">${escapeHtml(verificationLink)}</p>
        <p style="margin:18px 0 0;color:${MUTED_TEXT};font-size:13px">This link expires in 24 hours.</p>
      `,
    ),
  };
}

export function passwordResetEmail(name: string, resetLink: string) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Reset your ThriveFund password',
    html: appLayout(
      'Reset your ThriveFund password.',
      `
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
        ${button('Reset Password', resetLink)}
        <p style="word-break:break-all;color:${MUTED_TEXT};font-size:12px">${escapeHtml(resetLink)}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    ),
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
    html: appLayout(
      `Invitation to contribute to ${goalTitle}.`,
      `
        <p>Hi there,</p>
        <p><strong>${safeInviterName}</strong> has invited you to contribute to: <strong>${safeGoalTitle}</strong>.</p>
        ${expectedAmount ? detailsTable([['Expected amount', money(expectedAmount)]]) : ''}
        ${message ? `<blockquote style="border-left:3px solid ${BRAND_GREEN};padding-left:12px;color:#555">${escapeHtml(message)}</blockquote>` : ''}
        ${button('View Contribution Details', contributionLink)}
        <p style="word-break:break-all;color:${MUTED_TEXT};font-size:12px">${escapeHtml(contributionLink)}</p>
      `,
    ),
  };
}

export function paymentReceivedEmail(payerName: string, amount: number, goalTitle: string) {
  const safePayerName = escapeHtml(payerName);
  const safeGoalTitle = escapeHtml(goalTitle);
  return {
    subject: `Payment received: ${money(amount)} for ${goalTitle}`,
    html: appLayout(
      `Payment received for ${goalTitle}.`,
      `
        <p>Good news! A payment has been received and reconciled automatically.</p>
        ${detailsTable([
          ['Contributor', payerName],
          ['Amount', money(amount)],
          ['Campaign', goalTitle],
        ])}
      `,
    ),
  };
}

export async function sendPaymentReceivedEmail(
  to: string,
  data: { payerName: string; amount: number; goalTitle: string },
) {
  const template = paymentReceivedEmail(data.payerName, data.amount, data.goalTitle);
  await sendEmail({ to: { email: to }, subject: template.subject, html: template.html });
}

export function campaignCompletedEmail(goalTitle: string, amount: number, dashboardLink: string) {
  const safeGoalTitle = escapeHtml(goalTitle);
  return {
    subject: `Campaign completed: ${goalTitle}`,
    html: appLayout(
      `${goalTitle} reached its target.`,
      `
        <p style="margin:0 0 12px">Your campaign target has been reached.</p>
        ${detailsTable([
          ['Campaign', goalTitle],
          ['Collected', money(amount)],
          ['Collection status', 'Completed / inactive'],
        ])}
        <p>The virtual account has been expired for new collections. Manual close-out remains under your control.</p>
        ${button('Open Campaign', dashboardLink)}
      `,
    ),
  };
}

export function paymentMismatchEmail(data: {
  goalTitle: string;
  payerName: string;
  amount: number;
  matchType: 'under' | 'over';
  excessAmount?: number;
  dashboardLink: string;
}) {
  const label = data.matchType === 'over' ? 'Over-payment detected' : 'Under-payment received';
  return {
    subject: `${label}: ${data.goalTitle}`,
    html: appLayout(
      label,
      `
        <p style="margin:0 0 12px">${escapeHtml(data.payerName)} sent ${money(data.amount)} to ${escapeHtml(data.goalTitle)}.</p>
        ${detailsTable([
          ['Campaign', data.goalTitle],
          ['Payer', data.payerName],
          ['Amount', money(data.amount)],
          ...(data.excessAmount ? [['Excess amount', money(data.excessAmount)]] as [string, string][] : []),
          ['Match type', data.matchType],
        ])}
        ${button('Review in dashboard', data.dashboardLink)}
      `,
    ),
  };
}

export function webhookFailureEmail(eventType: string, reference: string, adminLink: string) {
  return {
    subject: `Webhook processing failed: ${eventType}`,
    html: appLayout(
      'Webhook processing needs admin attention.',
      `
        <p>A provider webhook could not be processed successfully.</p>
        ${detailsTable([
          ['Event type', eventType || 'unknown'],
          ['Provider reference', reference || 'unknown'],
        ])}
        ${button('Open Admin Webhooks', adminLink, '#DC2626')}
      `,
    ),
  };
}

export function withdrawalEmail(data: {
  goalTitle: string;
  amount: number;
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  status: 'initiated' | 'successful' | 'failed';
  failureReason?: string;
}) {
  const statusLabel =
    data.status === 'initiated' ? 'Withdrawal initiated' :
    data.status === 'successful' ? 'Withdrawal successful' :
    'Withdrawal failed';
  return {
    subject: `${statusLabel}: ${money(data.amount)} from ${data.goalTitle}`,
    html: appLayout(
      `${statusLabel} for ${data.goalTitle}.`,
      `
        <p>${statusLabel}.</p>
        ${detailsTable([
          ['Campaign', data.goalTitle],
          ['Amount', money(data.amount)],
          ['Destination', `${data.accountName} - ${data.bankName ?? 'Bank'} (${data.accountNumber})`],
          ['Status', data.status],
          ...(data.failureReason ? [['Reason', data.failureReason] as [string, string]] : []),
        ])}
      `,
    ),
  };
}
