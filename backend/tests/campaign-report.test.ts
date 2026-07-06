import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCampaignReport, campaignReportCsv } from '../src/lib/campaign-report';
import { paymentProofPdf } from '../src/lib/payment-proof';

test('buildCampaignReport maps payment rows with reconciliation fields', () => {
  const report = buildCampaignReport({
    goal: {
      id: 'goal_123',
      title: 'School Fees',
      slug: 'school-fees',
      organization_name: 'Demo Org',
      category: 'education',
      status: 'active',
      target_amount: 100000,
      current_amount: 45000,
    },
    transactions: [
      {
        transaction_id: 'txn_1',
        payer_name: 'John Doe',
        amount: 25000,
        payment_status: 'successful',
        date_paid: '2026-06-01T10:00:00.000Z',
        transfer_reference: 'TF-goal-ref-1',
        provider_reference: 'API-PAY-1',
        virtual_account_number: '9012345678',
        bank_name: 'GTBank',
        reconciliation_status: 'matched',
        verification_status: 'verified',
      },
    ],
  });

  assert.equal(report.payments.length, 1);
  assert.equal(report.payments[0]?.payer_name, 'John Doe');
  assert.equal(report.payments[0]?.amount_ngn, 25000);
  assert.equal(report.totals.successful_count, 1);
  assert.match(campaignReportCsv(report), /payer_name/);
  assert.match(campaignReportCsv(report), /John Doe/);
  assert.match(campaignReportCsv(report), /School Fees/);
});

test('paymentProofPdf renders a downloadable receipt buffer', async () => {
  const pdf = await paymentProofPdf({
    transaction_id: 'txn_1',
    campaign_title: 'School Fees',
    organization_name: 'Demo Org',
    payer_name: 'John Doe',
    amount: 25000,
    status: 'successful',
    paid_at: '2026-06-01T10:00:00.000Z',
    reference: 'TF-goal-ref-1',
    provider_reference: 'API-PAY-1',
    virtual_account_number: '9012345678',
    bank_name: 'GTBank',
    account_name: 'THRIVEFUND SCHOOL FEES',
    reconciliation_status: 'matched',
    verification_status: 'verified',
  });

  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 1000);
});
