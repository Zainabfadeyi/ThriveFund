import PDFDocument from 'pdfkit';

export type PaymentProof = {
  transaction_id: string;
  campaign_title: string;
  organization_name: string | null;
  payer_name: string;
  amount: number;
  status: string;
  paid_at: string | null;
  reference: string | null;
  provider_reference: string | null;
  virtual_account_number: string | null;
  bank_name: string | null;
  account_name: string | null;
  reconciliation_status: string | null;
  verification_status: string | null;
};

function money(amount: number) {
  return `NGN ${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function line(doc: PDFKit.PDFDocument, label: string, value: unknown) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#64748b')
    .text(label.toUpperCase());
  doc
    .moveDown(0.2)
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(String(value ?? '-'));
  doc.moveDown(0.8);
}

export async function paymentProofPdf(proof: PaymentProof): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#0f172a')
      .text('ThriveFund Payment Proof');
    doc
      .moveDown(0.4)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Generated ${formatDate(new Date().toISOString())}`);

    doc.moveDown(1.5);
    doc
      .roundedRect(48, doc.y, 499, 78, 8)
      .fillAndStroke('#ecfdf5', '#a7f3d0');
    doc
      .fillColor('#065f46')
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(money(proof.amount), 68, doc.y + 20);
    doc
      .font('Helvetica')
      .fontSize(12)
      .text(`Status: ${proof.status}`, 68, doc.y + 5);
    doc.moveDown(3.5);

    line(doc, 'Campaign', proof.campaign_title);
    line(doc, 'Organization', proof.organization_name ?? 'Independent organizer');
    line(doc, 'Payer', proof.payer_name || 'Anonymous');
    line(doc, 'Paid at', formatDate(proof.paid_at));
    line(doc, 'Transfer reference', proof.reference);
    line(doc, 'Provider reference', proof.provider_reference);
    line(doc, 'Virtual account', [
      proof.virtual_account_number,
      proof.bank_name,
      proof.account_name,
    ].filter(Boolean).join(' - ') || '-');
    line(doc, 'Reconciliation', proof.reconciliation_status ?? proof.verification_status ?? 'matched');

    doc
      .moveDown(1)
      .fontSize(9)
      .fillColor('#64748b')
      .text('This receipt confirms a payment recorded by ThriveFund after Nomba reconciliation. Use the provider reference for support or audit follow-up.');
    doc.end();
  });
}

export function paymentProofFilename(proof: PaymentProof) {
  const ref = proof.provider_reference || proof.reference || proof.transaction_id;
  return `payment-proof-${String(ref).replace(/[^a-z0-9_-]/gi, '').slice(0, 48) || proof.transaction_id}.pdf`;
}
