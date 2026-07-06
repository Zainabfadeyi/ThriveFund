'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';
import { Copy, Share2, ArrowLeft, Plus, Download, CheckCircle2, Lock, Timer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useGoalOverview,
  useGoalTransactions,
  useCreateVirtualAccount,
  useExportCampaign,
  useCreateWithdrawal,
  useCloseGoal,
  useExpireCollection,
} from '@/hooks/use-api';
import { formatNaira, getInitials, downloadFile } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';
import { CollapsibleSection } from '@/components/campaign/collapsible-section';
import { PayoutStatus, resolvePayoutPhase } from '@/components/campaign/payout-status';
import { useDashboardCampaignId } from '@/hooks/use-dashboard-campaign-id';
import { transactionsApi } from '@/lib/api/services';
import type { Transaction } from '@/lib/api/types';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function PayoutTimeline({ steps }: { steps: Array<{ label: string; done: boolean; detail: string }> }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.label}
          className={`rounded-lg border p-3 ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${step.done ? 'text-emerald-600' : 'text-slate-300'}`} />
            <p className="text-sm font-semibold">{step.label}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}

export default function CampaignDetailClient() {
  const pathnameId = useDashboardCampaignId();
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const campaignsIdx = segments.indexOf('campaigns');
  const rawId = campaignsIdx >= 0 ? (segments[campaignsIdx + 1] ?? '') : '';
  const fallbackId = rawId && rawId !== '_' && rawId !== 'new' && rawId !== 'campaigns' ? rawId : '';
  const id = pathnameId || fallbackId;
  const { data: overview, isLoading, error, refetch } = useGoalOverview(id);
  const [txnStatus, setTxnStatus] = useState('all');
  const [txnSearch, setTxnSearch] = useState('');
  const debouncedTxnSearch = useDebouncedValue(txnSearch.trim(), 350);
  const usingTxnFilters = txnStatus !== 'all' || Boolean(debouncedTxnSearch);
  const { data: filteredTxns } = useGoalTransactions(id, {
    status: txnStatus === 'all' ? undefined : txnStatus,
    q: debouncedTxnSearch || undefined,
    per_page: 25,
  }, { enabled: usingTxnFilters });
  const createVa = useCreateVirtualAccount();
  const exportCampaign = useExportCampaign();
  const createWithdrawal = useCreateWithdrawal(id);
  const closeGoal = useCloseGoal();
  const expireCollection = useExpireCollection();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedPayoutId, setSelectedPayoutId] = useState('');

  if (isLoading) return <LoadingState />;
  if (error && !overview?.goal) {
    const isMissingGoal = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        message={isMissingGoal ? 'Collection not found. Create a new collection to start accepting payments.' : getAuthErrorMessage(error)}
        onRetry={isMissingGoal ? undefined : () => refetch()}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/campaigns">Back to Collections</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="h-4 w-4" /> Create Collection
              </Link>
            </Button>
          </div>
        }
      />
    );
  }
  if (!overview?.goal) return null;

  const campaign = overview.goal;
  const va = overview.virtual_account;
  const txns = usingTxnFilters ? filteredTxns : overview.transactions;
  const members = overview.contributors;
  const share = overview.share;
  const payoutAccounts = overview.payout_accounts;
  const withdrawals = overview.withdrawals;
  const withdrawalAvailability = overview.withdrawal_availability;
  const progress = Number(campaign.progress_percent ?? 0);
  const publicSlug = campaign.slug ?? campaign.id;
  const publicUrl = share?.public_url ?? (publicSlug ? window.location.origin + '/c/' + publicSlug + '/' : '');
  const isCompleted = campaign.status === 'completed';
  const vaActive = va?.status === 'active';
  const graceDays = campaign.collection_grace_days ?? 7;
  const collectionExpiresAt = campaign.collection_expires_at ? new Date(campaign.collection_expires_at) : null;
  const gracePending = isCompleted && vaActive && collectionExpiresAt && collectionExpiresAt > new Date();
  const closedEarly = isCompleted && Boolean(campaign.closed_at) && Number(campaign.current_amount) < Number(campaign.target_amount);
  const feeReserve = campaign.payout_fee_ngn ?? withdrawalAvailability?.transfer_fee_reserve ?? 50;
  const availableForWithdrawal = withdrawalAvailability?.max_withdrawable ?? 0;
  const nombaBalance = withdrawalAvailability?.nomba_balance;
  const nombaBalanceAvailable = withdrawalAvailability?.nomba_balance_available ?? false;
  const settlementLag = withdrawalAvailability?.settlement_lag ?? false;
  const excessAmount = campaign.excess_amount ?? Math.max(0, Number(campaign.current_amount) - Number(campaign.target_amount));
  const progressDisplay = Math.min(100, progress);
  const campaignAvailable = Math.max(0, Number(campaign.current_amount) - (withdrawals ?? [])
    .filter((w) => ['pending', 'processing', 'successful'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount), 0));
  const defaultPayout = payoutAccounts?.find((account) => Boolean(account.is_default)) ?? payoutAccounts?.[0];
  const payoutId = selectedPayoutId || defaultPayout?.id || '';
  const payoutProcessing = (withdrawals ?? []).some((w) => ['pending', 'processing'].includes(w.status));
  const payoutSuccessful = (withdrawals ?? []).some((w) => w.status === 'successful');
  const payoutPhase = resolvePayoutPhase({
    isCompleted,
    hasPayoutAccount: Boolean(payoutAccounts?.length),
    payoutProcessing,
    payoutSuccessful,
    availableForWithdrawal,
    nombaBalanceAvailable,
    campaignAvailable,
  });
  const canWithdrawNow = payoutPhase === 'ready' && Boolean(payoutId) && nombaBalanceAvailable;
  const payoutRequested = (withdrawals ?? []).some((w) => ['pending', 'processing', 'successful'].includes(w.status));
  const payoutSteps = [
    {
      label: 'Collected',
      done: Number(campaign.current_amount) > 0,
      detail: `${formatNaira(Number(campaign.current_amount))} recorded`,
    },
    {
      label: 'Settled',
      done: nombaBalanceAvailable || payoutRequested || payoutSuccessful,
      detail: nombaBalanceAvailable ? 'Ready for payout' : 'Waiting for settlement',
    },
    {
      label: 'Payout requested',
      done: payoutRequested,
      detail: payoutRequested ? 'Request submitted' : 'Not requested yet',
    },
    {
      label: 'Paid out',
      done: payoutSuccessful,
      detail: payoutSuccessful ? 'Sent to bank' : 'Awaiting completion',
    },
  ];

  const handleCreateVa = async () => {
    try {
      await createVa.mutateAsync(id);
      toast.success('Virtual account created');
      refetch();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await exportCampaign.mutateAsync({ id, format });
      const slug = campaign.slug ?? campaign.id;
      const filename = `campaign-${slug}-report.${format}`;
      if (res.data instanceof Blob) {
        downloadFile(res.data, filename);
      } else {
        downloadFile(res.data, filename, format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8');
      }
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleReceipt = async (txn: Transaction) => {
    try {
      const res = await transactionsApi.receipt(txn.id);
      downloadFile(res.data, `payment-proof-${txn.provider_reference ?? txn.reference ?? txn.id}.pdf`);
      toast.success('Payment proof downloaded');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleWithdraw = async () => {
    try {
      const res = await createWithdrawal.mutateAsync({
        payout_account_id: payoutId || undefined,
        amount: withdrawalAmount ? Number(withdrawalAmount) : undefined,
      });
      setWithdrawalAmount('');
      const status = res.data.withdrawal.status;
      if (status === 'successful') {
        toast.success('Withdrawal completed — funds sent to your bank account', {
          style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
        });
      } else if (status === 'processing' || status === 'pending') {
        toast.success('Withdrawal is processing — your balance will update when Nomba confirms');
      } else {
        toast.error(res.data.withdrawal.failure_reason ?? 'Withdrawal failed');
      }
      refetch();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleCloseEarly = async () => {
    if (!window.confirm('Close this collection now? The payment account will stop accepting new transfers. You can still withdraw what has been collected.')) {
      return;
    }
    try {
      await closeGoal.mutateAsync(id);
      toast.success('Collection closed — payment account expired');
      refetch();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleExpireNow = async () => {
    if (!window.confirm('Expire the payment account now? Contributors should no longer transfer to this account number.')) {
      return;
    }
    try {
      await expireCollection.mutateAsync(id);
      toast.success('Payment account expired');
      refetch();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const nextAction = !va
    ? {
      title: 'Set up collection account',
      description: 'Generate the dedicated account contributors will pay into.',
      action: <Button onClick={handleCreateVa} disabled={createVa.isPending}>{createVa.isPending ? 'Generating...' : 'Generate Account'}</Button>,
    }
    : !isCompleted
      ? {
        title: 'Ready to share',
        description: 'Copy the public link or account number and send it to contributors.',
        action: <Button variant="outline" asChild><Link href={'/c/' + publicSlug + '/'}><Share2 className="h-4 w-4" /> Open Public Page</Link></Button>,
      }
      : !payoutAccounts?.length
        ? {
          title: 'Add payout account',
          description: 'Save a verified bank account before withdrawing collected funds.',
          action: <Button asChild><Link href="/dashboard/settings">Open Settings</Link></Button>,
        }
        : payoutProcessing
          ? {
            title: 'Payout in progress',
            description: 'We are waiting for final payout confirmation. This page will update automatically.',
            action: null,
          }
          : payoutSuccessful
            ? {
              title: 'Collection paid out',
              description: 'Funds have been sent to your payout account. You can export the final report.',
              action: <Button variant="outline" onClick={() => handleExport('csv')} disabled={exportCampaign.isPending}><Download className="h-4 w-4" /> Export Report</Button>,
            }
            : {
              title: availableForWithdrawal > 0 ? 'Ready to withdraw' : 'Funds are settling',
              description: availableForWithdrawal > 0
                ? `Withdraw up to ${formatNaira(availableForWithdrawal)} to your saved payout account.`
                : 'Payments are recorded, but the settled payout balance is not ready yet.',
              action: canWithdrawNow ? (
                <Button onClick={handleWithdraw} disabled={createWithdrawal.isPending}>
                  Withdraw {formatNaira(availableForWithdrawal)}
                </Button>
              ) : null,
            };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/dashboard/campaigns"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>

      <PageHeader
        title={campaign.title}
        description={campaign.category + ' · ' + campaign.status}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={exportCampaign.isPending}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exportCampaign.isPending}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            {publicSlug && <Button variant="outline" asChild><Link href={'/c/' + publicSlug + '/'}><Share2 className="h-4 w-4" /> Public</Link></Button>}
            {!isCompleted && va && (
              <Button variant="destructive" onClick={handleCloseEarly} disabled={closeGoal.isPending}>
                <Lock className="h-4 w-4" /> Close Collection Early
              </Button>
            )}
            {gracePending && (
              <Button variant="outline" onClick={handleExpireNow} disabled={expireCollection.isPending}>
                <Timer className="h-4 w-4" /> Expire Account Now
              </Button>
            )}
          </div>
        }
      />

      {excessAmount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Over-collection recorded</p>
          <p className="mt-1">
            Target was {formatNaira(Number(campaign.target_amount))} · Collected {formatNaira(Number(campaign.current_amount))} · Excess {formatNaira(excessAmount)}.
            The full collected amount can be withdrawn after completion (minus transfer fee).
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {closedEarly
                  ? 'Collection closed early — no longer accepting payments.'
                  : 'Target reached. This campaign is inactive for collections.'}
              </p>
              <p className="mt-1 text-emerald-800">
                {gracePending && collectionExpiresAt
                  ? `The payment account stays open until ${collectionExpiresAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} (${graceDays}-day grace) to catch late transfers. Use "Expire Account Now" to close it sooner.`
                  : 'The virtual account is expired or pending expiry, and contributors should no longer transfer to it. Withdraw collected funds when ready.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-6 border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Next action</p>
            <h2 className="mt-1 text-lg font-semibold">{nextAction.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{nextAction.description}</p>
          </div>
          {nextAction.action}
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold">{formatNaira(Number(campaign.current_amount))}</p></CardContent></Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-2xl font-bold">{formatNaira(Number(campaign.target_amount))}</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Progress</p><p className="text-2xl font-bold text-primary">{progress}%</p><Progress value={progressDisplay} className="mt-3 h-2" /></CardContent></Card>
      </div>

      <CollapsibleSection title="Account & share link" defaultOpen={!isCompleted}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {va ? (
              <>
                <div className={`rounded-xl border border-dashed p-5 ${isCompleted && !vaActive ? 'border-emerald-300 bg-emerald-50' : gracePending ? 'border-amber-300 bg-amber-50' : isCompleted || va.status === 'inactive' ? 'border-emerald-300 bg-emerald-50' : 'border-primary/30 bg-primary/5'}`}>
                  <p className="text-xs uppercase text-muted-foreground">Account Number</p>
                  <p className="text-2xl font-bold tracking-wider">{va.account_number}</p>
                  <p className="mt-2 text-sm">{va.bank_name} · {va.account_name}</p>
                  {gracePending && collectionExpiresAt && (
                    <p className="mt-3 text-sm font-medium text-amber-800">
                      Accepting payments until {collectionExpiresAt.toLocaleDateString('en-NG')}
                    </p>
                  )}
                  {(isCompleted && !vaActive) || va.status === 'inactive' ? (
                    <p className="mt-3 text-sm font-medium text-emerald-800">Expired for new collections</p>
                  ) : null}
                </div>
                {!isCompleted && va.status !== 'inactive' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(va.account_number); toast.success('Copied'); }}>
                      <Copy className="h-4 w-4" /> Copy Number
                    </Button>
                    <Button variant="outline" className="text-destructive" onClick={handleCloseEarly} disabled={closeGoal.isPending}>
                      <Lock className="h-4 w-4" /> Close Early
                    </Button>
                  </div>
                )}
                {gracePending && (
                  <Button variant="outline" onClick={handleExpireNow} disabled={expireCollection.isPending}>
                    <Timer className="h-4 w-4" /> Expire Account Now
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Payment account is being set up or needs to be generated.</p>
                <Button onClick={handleCreateVa} disabled={createVa.isPending}>
                  {createVa.isPending ? 'Generating...' : 'Generate Account'}
                </Button>
              </>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            {publicUrl ? (
              <>
                <QRCodeSVG value={publicUrl} size={160} />
                <p className="text-center text-xs break-all text-muted-foreground">{publicUrl}</p>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied'); }}>Copy Link</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Share link unavailable</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {isCompleted && payoutPhase && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Payout</CardTitle></CardHeader>
          <CardContent>
            <PayoutTimeline steps={payoutSteps} />
            <PayoutStatus
              phase={payoutPhase}
              availableForWithdrawal={availableForWithdrawal}
              feeReserve={feeReserve}
              nombaBalance={nombaBalance}
              campaignAvailable={campaignAvailable}
              settlementLag={settlementLag}
              balanceError={withdrawalAvailability?.balance_error}
            >
              {payoutPhase === 'ready' && payoutAccounts?.length ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <Select value={payoutId} onValueChange={setSelectedPayoutId}>
                    <SelectTrigger><SelectValue placeholder="Payout account" /></SelectTrigger>
                    <SelectContent>
                      {payoutAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name ?? account.bank_code} ({account.account_number.slice(-4)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    max={availableForWithdrawal}
                    placeholder={`Up to ${formatNaira(availableForWithdrawal)}`}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                  />
                  <Button onClick={handleWithdraw} disabled={!payoutId || !canWithdrawNow || createWithdrawal.isPending}>
                    Withdraw
                  </Button>
                </div>
              ) : payoutPhase === 'needs_payout_account' ? (
                <Button variant="outline" size="sm" asChild><Link href="/dashboard/settings">Open Settings</Link></Button>
              ) : null}
            </PayoutStatus>
            {!!withdrawals?.length && (
              <div className="mt-6 rounded-lg border">
                <Table>
                  <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{formatNaira(Number(w.amount))}</TableCell>
                        <TableCell>{w.account_name} · {w.bank_name ?? ''}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <StatusBadge status={w.status} />
                            {w.status === 'failed' && w.failure_reason && (
                              <p className="text-xs text-muted-foreground">{w.failure_reason}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{w.created_at ? new Date(w.created_at).toLocaleDateString('en-NG') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CollapsibleSection title="Contributors & payments" defaultOpen={false}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Contributors</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Expected</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!members?.length ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No contributors yet</TableCell></TableRow>
                ) : members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(m.name)}</AvatarFallback></Avatar>
                        {m.name}
                      </div>
                    </TableCell>
                    <TableCell>{m.expected_amount ? formatNaira(Number(m.expected_amount)) : '-'}</TableCell>
                    <TableCell>{formatNaira(Number(m.total_contributed ?? 0))}</TableCell>
                    <TableCell><StatusBadge status={m.payment_status ?? 'not_set'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Payment activity</h3>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Search payer or reference" value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} />
              <Select value={txnStatus} onValueChange={setTxnStatus}>
                <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Proof</TableHead></TableRow></TableHeader>
              <TableBody>
                {!txns?.length ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No payments yet</TableCell></TableRow>
                ) : txns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.contributor_name}</TableCell>
                    <TableCell>{formatNaira(Number(t.amount))}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">
                      {t.status === 'successful' ? (
                        <Button size="sm" variant="outline" onClick={() => handleReceipt(t)}>
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
