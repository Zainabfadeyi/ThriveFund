import PDFDocument from 'pdfkit';

export type CampaignPaymentRow = {
  transaction_id: string;
  payer_name: string;
  amount_ngn: number;
  date_paid: string | null;
  payment_status: string;
  transfer_reference: string;
  provider_reference: string;
  virtual_account_number: string | null;
  bank_name: string | null;
  reconciliation_status: string | null;
  verification_status: string | null;
};

export type CampaignReport = {
  generated_at: string;
  campaign: {
    id: string;
    title: string;
    slug: string | null;
    organization_name: string | null;
    category: string | null;
    status: string;
    target_amount: number;
    current_amount: number;
    created_at: string | null;
    completed_at: string | null;
  };
  payments: CampaignPaymentRow[];
  totals: {
    payment_count: number;
    successful_count: number;
    successful_total: number;
    pending_count: number;
    failed_count: number;
  };
};

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function money(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function computeTotals(payments: CampaignPaymentRow[]) {
  const successful = payments.filter((row) => row.payment_status === 'successful');
  return {
    payment_count: payments.length,
    successful_count: successful.length,
    successful_total: successful.reduce((sum, row) => sum + row.amount_ngn, 0),
    pending_count: payments.filter((row) => row.payment_status === 'pending' || row.payment_status === 'pending_review').length,
    failed_count: payments.filter((row) => ['failed', 'duplicate'].includes(row.payment_status)).length,
  };
}

export function buildCampaignReport(pack: {
  goal: Record<string, unknown>;
  transactions: Record<string, unknown>[];
}): CampaignReport {
  const payments: CampaignPaymentRow[] = pack.transactions.map((row) => ({
    transaction_id: String(row.transaction_id ?? row.id ?? ''),
    payer_name: String(row.payer_name ?? row.contributor_name ?? 'Anonymous'),
    amount_ngn: Number(row.amount ?? 0),
    date_paid: row.date_paid ? String(row.date_paid) : row.paid_at ? String(row.paid_at) : null,
    payment_status: String(row.payment_status ?? row.status ?? ''),
    transfer_reference: String(row.transfer_reference ?? row.reference ?? ''),
    provider_reference: String(row.provider_reference ?? ''),
    virtual_account_number: row.virtual_account_number ? String(row.virtual_account_number) : null,
    bank_name: row.bank_name ? String(row.bank_name) : null,
    reconciliation_status: row.reconciliation_status ? String(row.reconciliation_status) : null,
    verification_status: row.verification_status ? String(row.verification_status) : null,
  }));

  return {
    generated_at: new Date().toISOString(),
    campaign: {
      id: String(pack.goal.id ?? ''),
      title: String(pack.goal.title ?? ''),
      slug: pack.goal.slug ? String(pack.goal.slug) : null,
      organization_name: pack.goal.organization_name ? String(pack.goal.organization_name) : null,
      category: pack.goal.category ? String(pack.goal.category) : null,
      status: String(pack.goal.status ?? ''),
      target_amount: Number(pack.goal.target_amount ?? 0),
      current_amount: Number(pack.goal.current_amount ?? 0),
      created_at: pack.goal.created_at ? String(pack.goal.created_at) : null,
      completed_at: pack.goal.completed_at ? String(pack.goal.completed_at) : null,
    },
    payments,
    totals: computeTotals(payments),
  };
}

export function campaignReportCsv(report: CampaignReport): string {
  const summaryRows = [
    ['Report generated at', formatDate(report.generated_at)],
    ['Campaign', report.campaign.title],
    ['Campaign ID', report.campaign.id],
    ['Organization', report.campaign.organization_name ?? ''],
    ['Category', report.campaign.category ?? ''],
    ['Status', report.campaign.status],
    ['Target amount (NGN)', report.campaign.target_amount.toFixed(2)],
    ['Collected amount (NGN)', report.campaign.current_amount.toFixed(2)],
    ['Successful payments', report.totals.successful_count],
    ['Successful total (NGN)', report.totals.successful_total.toFixed(2)],
    ['Pending payments', report.totals.pending_count],
    ['Failed/duplicate payments', report.totals.failed_count],
    ['Total payment rows', report.totals.payment_count],
  ];

  const paymentHeaders = [
    'transaction_id',
    'payer_name',
    'amount_ngn',
    'date_paid',
    'payment_status',
    'transfer_reference',
    'provider_reference',
    'virtual_account_number',
    'bank_name',
    'reconciliation_status',
    'verification_status',
  ];

  const lines = [
    'ThriveFund Campaign Payment Report',
    '',
    'Summary',
    'Field,Value',
    ...summaryRows.map(([field, value]) => `${csvEscape(field)},${csvEscape(value)}`),
    '',
    'Payments',
    paymentHeaders.join(','),
    ...report.payments.map((row) =>
      paymentHeaders.map((header) => csvEscape(row[header as keyof CampaignPaymentRow])).join(','),
    ),
  ];

  return lines.join('\n');
}

export async function campaignReportPdf(report: CampaignReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('ThriveFund Campaign Payment Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555555').text(`Generated: ${formatDate(report.generated_at)}`, { align: 'center' });
    doc.moveDown(1.2);
    doc.fillColor('#000000');

    doc.fontSize(14).text(report.campaign.title);
    doc.moveDown(0.4);
    doc.fontSize(10);
    doc.text(`Campaign ID: ${report.campaign.id}`);
    if (report.campaign.organization_name) doc.text(`Organization: ${report.campaign.organization_name}`);
    doc.text(`Category: ${report.campaign.category ?? '—'} · Status: ${report.campaign.status}`);
    doc.text(`Target: ${money(report.campaign.target_amount)} · Collected: ${money(report.campaign.current_amount)}`);
    doc.text(
      `Payments: ${report.totals.successful_count} successful (${money(report.totals.successful_total)}) · `
      + `${report.totals.pending_count} pending · ${report.totals.failed_count} failed/duplicate`,
    );
    doc.moveDown(1);

    const columns = [
      { label: 'Payer', width: 95 },
      { label: 'Amount', width: 70 },
      { label: 'Date paid', width: 95 },
      { label: 'Status', width: 55 },
      { label: 'Reference', width: 120 },
      { label: 'Provider ref', width: 115 },
    ];

    const startX = doc.x;
    let y = doc.y;

    doc.font('Helvetica-Bold').fontSize(9);
    let x = startX;
    for (const column of columns) {
      doc.text(column.label, x, y, { width: column.width, lineBreak: false });
      x += column.width;
    }
    y += 16;
    doc.moveTo(startX, y).lineTo(startX + 550, y).stroke('#cccccc');
    y += 6;

    doc.font('Helvetica').fontSize(8);
    if (!report.payments.length) {
      doc.text('No payments recorded for this campaign.', startX, y);
    } else {
      for (const row of report.payments) {
        if (y > 760) {
          doc.addPage();
          y = 40;
        }

        x = startX;
        const values = [
          row.payer_name,
          money(row.amount_ngn),
          formatDate(row.date_paid) || '—',
          row.payment_status,
          row.transfer_reference,
          row.provider_reference,
        ];

        let rowHeight = 12;
        for (let i = 0; i < columns.length; i += 1) {
          const height = doc.heightOfString(values[i], { width: columns[i].width });
          rowHeight = Math.max(rowHeight, height);
        }

        x = startX;
        for (let i = 0; i < columns.length; i += 1) {
          doc.text(values[i], x, y, { width: columns[i].width });
          x += columns[i].width;
        }

        y += rowHeight + 4;
      }
    }

    doc.end();
  });
}

export function campaignReportFilename(report: CampaignReport, format: 'csv' | 'pdf') {
  const slug = report.campaign.slug ?? report.campaign.id;
  const safe = slug.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 48);
  return `campaign-${safe}-report.${format}`;
}
