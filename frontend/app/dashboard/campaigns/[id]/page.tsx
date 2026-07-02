'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Copy, QrCode, Share2, ArrowLeft, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useGoal,
  useGoalVirtualAccount,
  useGoalTransactions,
  useGoalContributors,
  useGoalShare,
  useCreateVirtualAccount,
} from '@/hooks/use-api';
import { formatNaira, getInitials } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: campaign, isLoading, error, refetch } = useGoal(id);
  const { data: va, refetch: refetchVa } = useGoalVirtualAccount(id);
  const { data: txns } = useGoalTransactions(id);
  const { data: members } = useGoalContributors(id);
  const { data: share } = useGoalShare(id);
  const createVa = useCreateVirtualAccount();

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
  const publicUrl = share?.public_url ?? (campaign.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${campaign.slug}` : '');

  const handleCreateVa = async () => {
    try {
      await createVa.mutateAsync(id);
      toast.success('Virtual account created');
      refetchVa();
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
        description={`${campaign.category} · ${campaign.status}`}
        action={
          <div className="flex gap-2">
            {campaign.slug && <Button variant="outline" asChild><Link href={`/c/${campaign.slug}`}><Share2 className="h-4 w-4" /> Public</Link></Button>}
          </div>
        }
      />

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
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
                  <p className="text-xs uppercase text-muted-foreground">Account Number</p>
                  <p className="text-2xl font-bold tracking-wider">{va.account_number}</p>
                  <p className="mt-2 text-sm">{va.bank_name} · {va.account_name}</p>
                </div>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(va.account_number); toast.success('Copied'); }}>
                  <Copy className="h-4 w-4" /> Copy Number
                </Button>
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
                    <TableCell>{m.expected_amount ? formatNaira(Number(m.expected_amount)) : '—'}</TableCell>
                    <TableCell>{formatNaira(Number(m.total_contributed ?? 0))}</TableCell>
                    <TableCell><StatusBadge status={m.payment_status ?? 'not_set'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent className="p-0">
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
