'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Copy, QrCode, Share2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  getCampaignById,
  getContributorsByCampaignId,
  getTransactionsByCampaignId,
  getVirtualAccountByCampaignId,
  campaignTypeLabels,
} from '@/lib/mock-data';
import { calcProgress, formatNaira, getInitials } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const campaign = getCampaignById(id);
  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button className="mt-4" asChild><Link href="/dashboard/campaigns">Back to Campaigns</Link></Button>
      </div>
    );
  }

  const va = getVirtualAccountByCampaignId(campaign.id);
  const txns = getTransactionsByCampaignId(campaign.id);
  const members = getContributorsByCampaignId(campaign.id);

  const copyAccount = () => {
    if (va) navigator.clipboard.writeText(va.accountNumber);
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/dashboard/campaigns"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns</Link>
      </Button>

      <PageHeader
        title={campaign.name}
        description={`${campaign.organizationName} · ${campaignTypeLabels[campaign.type]}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href={`/c/${campaign.slug}`}><Share2 className="h-4 w-4" /> Share</Link></Button>
            <Button asChild><Link href="/dashboard/invitations">Invite Contributors</Link></Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold">{formatNaira(campaign.raised)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Target</p><p className="text-2xl font-bold">{formatNaira(campaign.target)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Contributors</p><p className="text-2xl font-bold">{campaign.contributors}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Progress</p><p className="text-2xl font-bold text-primary">{calcProgress(campaign.raised, campaign.target)}%</p></CardContent></Card>
      </div>

      <div className="mb-8"><Progress value={calcProgress(campaign.raised, campaign.target)} className="h-3" /></div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {va && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">Mock Virtual Account <StatusBadge status={va.status} /></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account Number</p>
                <p className="text-2xl font-bold tracking-wider text-thrive-dark">{va.accountNumber}</p>
                <p className="mt-2 text-sm">{va.bankName} · {va.accountName}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyAccount}><Copy className="h-4 w-4" /> Copy Number</Button>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(campaign.shareLink)}><Share2 className="h-4 w-4" /> Copy Link</Button>
              </div>
              <p className="text-xs text-amber-700">Mock account — live Nomba VA provisioning from July 1</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Share QR Code</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-xl border bg-white p-4">
              <QRCodeSVG value={campaign.shareLink} size={160} />
            </div>
            <p className="text-center text-sm text-muted-foreground break-all">{campaign.shareLink}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contributors</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {members.slice(0, 5).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(m.name)}</AvatarFallback></Avatar>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatNaira(m.totalPaid)}</TableCell>
                    <TableCell><StatusBadge status={m.paymentStatus} /></TableCell>
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
                {txns.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No payments yet</TableCell></TableRow>
                ) : txns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.payer}</TableCell>
                    <TableCell className="font-medium">{formatNaira(t.amount)}</TableCell>
                    <TableCell><StatusBadge status={t.reconciliationStatus} /></TableCell>
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
