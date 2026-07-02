'use client';

import Link from 'next/link';
import { useState } from 'react';

import { usePathname } from 'next/navigation';
import { Copy, QrCode, Share2, ArrowLeft, Plus, Download, CheckCircle2 } from 'lucide-react';
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
  useGoal,
  useGoalVirtualAccount,
  useGoalTransactions,
  useGoalContributors,
  useGoalShare,
  useCreateVirtualAccount,
  useExportCampaign,
  usePayoutAccounts,
  useCreateWithdrawal,
  useGoalWithdrawals,
} from '@/hooks/use-api';
import { formatNaira, getInitials, downloadFile } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';

export default function CampaignDetailClient() {
  const pathname = usePathname();
  // Extract real ID from the URL — useParams() reads the pre-rendered placeholder in static export
  const id = pathname.split('/').filter(Boolean).pop() ?? '';
  const { data: campaign, isLoading, error, refetch } = useGoal(id);
  const { data: va, refetch: refetchVa } = useGoalVirtualAccount(id);
  const [txnStatus, setTxnStatus] = useState('all');
  const [txnSearch, setTxnSearch] = useState('');
  const { data: txns } = useGoalTransactions(id, {
    status: txnStatus === 'all' ? undefined : txnStatus,
    q: txnSearch || undefined,
  });
  const { data: members } = useGoalContributors(id);
  const { data: share } = useGoalShare(id);
  const { data: payoutAccounts } = usePayoutAccounts();
  const { data: withdrawals } = useGoalWithdrawals(id);
  const createVa = useCreateVirtualAccount();
  const exportCampaign = useExportCampaign();
  const createWithdrawal = useCreateWithdrawal(id);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedPayoutId, setSelectedPayoutId] = useState('');

  if (isLoading) return <LoadingState />;
  if (error && !campaign) {
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
  if (!campaign) return null;

  const progress = Number(campaign.progress_percent ?? 0);
  const publicUrl = share?.public_url ?? (campaign.slug ? window.location.origin + '/c/' + campaign.slug : '');
  const isCompleted = campaign.status === 'completed';
  const reservedWithdrawals = (withdrawals ?? [])
    .filter((w) => ['pending', 'processing', 'successful'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const availableForWithdrawal = Math.max(0, Number(campaign.current_amount) - reservedWithdrawals);
  const defaultPayout = payoutAccounts?.find((account) => Boolean(account.is_default)) ?? payoutAccounts?.[0];
  const payoutId = selectedPayoutId || defaultPayout?.id || '';

  const handleCreateVa = async () => {
    try {
      await createVa.mutateAsync(id);
      toast.success('Virtual account created');
      refetchVa();
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

  const handleWithdraw = async () => {
    try {
      const res = await createWithdrawal.mutateAsync({
        payout_account_id: payoutId || undefined,
        amount: withdrawalAmount ? Number(withdrawalAmount) : undefined,
      });
      setWithdrawalAmount('');
      const status = res.data.withdrawal.status;
      if (status === 'successful') {
        toast.success('Withdrawal completed — funds sent to your bank account');
      } else if (status === 'processing' || status === 'pending') {
        toast.success('Withdrawal is processing — your balance will update when Nomba confirms');
      } else {
        toast.error(res.data.withdrawal.failure_reason ?? 'Withdrawal failed');
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={exportCampaign.isPending}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exportCampaign.isPending}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            {campaign.slug && <Button variant="outline" asChild><Link href={'/c/' + campaign.slug}><Share2 className="h-4 w-4" /> Public</Link></Button>}
          </div>
        }
      />

      {isCompleted && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Target reached. This campaign is inactive for collections.</p>
              <p className="mt-1 text-emerald-800">The virtual account is expired or pending expiry, and contributors should no longer transfer to it. Manual close-out/payout stays under organization control.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold">{formatNaira(Number(campaign.current_amount))}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Target</p><p className="text-2xl font-bold">{formatNaira(Number(campaign.target_amount))}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Contributors</p><p className="text-2xl font-bold">{campaign.contributors_count ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Progress</p><p className="text-2xl font-bold text-primary">{progress}%</p></CardContent></Card>
      </div>

      <div className="mb-8"><Progress value={progress} className="h-3" /></div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Virtual Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {va ? (
              <>
                <div className={`rounded-xl border border-dashed p-5 ${isCompleted || va.status === 'inactive' ? 'border-emerald-300 bg-emerald-50' : 'border-primary/30 bg-primary/5'}`}>
                  <p className="text-xs uppercase text-muted-foreground">Account Number</p>
                  <p className="text-2xl font-bold tracking-wider">{va.account_number}</p>
                  <p className="mt-2 text-sm">{va.bank_name} · {va.account_name}</p>
                  {(isCompleted || va.status === 'inactive') && <p className="mt-3 text-sm font-medium text-emerald-800">Expired for new collections</p>}
                </div>
                {!isCompleted && va.status !== 'inactive' && (
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(va.account_number); toast.success('Copied'); }}>
                    <Copy className="h-4 w-4" /> Copy Number
                  </Button>
                )}
                {isCompleted && (
                  <Button variant="outline" disabled>
                    Manual Close-Out Ready
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No virtual account yet. Generate one so contributors have a dedicated account for this campaign.</p>
                <Button onClick={handleCreateVa} disabled={createVa.isPending}>Generate Virtual Account</Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Share</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {publicUrl ? (
              <>
                <QRCodeSVG value={publicUrl} size={160} />
                <p className="text-center text-xs break-all text-muted-foreground">{publicUrl}</p>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied'); }}>Copy Link</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Share link unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isCompleted && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Withdraw Funds</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-xl font-bold">{formatNaira(Number(campaign.current_amount))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Already Withdrawn / Reserved</p>
                <p className="text-xl font-bold">{formatNaira(reservedWithdrawals)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-bold text-primary">{formatNaira(availableForWithdrawal)}</p>
              </div>
            </div>
            {!payoutAccounts?.length ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Add a verified payout account in Settings before withdrawing.
                <Button className="mt-3" variant="outline" size="sm" asChild><Link href="/dashboard/settings">Open Settings</Link></Button>
              </div>
            ) : (
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
                  placeholder="Amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                />
                <Button onClick={handleWithdraw} disabled={!payoutId || availableForWithdrawal <= 0 || createWithdrawal.isPending}>
                  Withdraw
                </Button>
              </div>
            )}
            {!!withdrawals?.length && (
              <div className="rounded-lg border">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contributors</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Expected</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!members?.length ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No expected payers yet</TableCell></TableRow>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
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
              <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!txns?.length ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No payments yet</TableCell></TableRow>
                ) : txns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.contributor_name}</TableCell>
                    <TableCell>{formatNaira(Number(t.amount))}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
