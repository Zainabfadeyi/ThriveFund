import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCampaignBySlug, getVirtualAccountByCampaignId } from '@/lib/mock-data';
import { calcProgress, formatNaira } from '@/lib/utils';
import { PublicCopyButton } from './copy-button';

export default async function PublicCampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign) notFound();

  const va = getVirtualAccountByCampaignId(campaign.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo />
          <Button variant="outline" size="sm" asChild><Link href="/login">Organizer Login</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-2 text-sm text-muted-foreground">{campaign.organizationName}</div>
        <h1 className="mb-4 text-3xl font-bold text-thrive-dark">{campaign.name}</h1>
        <p className="mb-8 text-slate-600">{campaign.description}</p>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex justify-between text-sm">
              <span>{formatNaira(campaign.raised)} raised</span>
              <span className="font-semibold text-primary">{calcProgress(campaign.raised, campaign.target)}%</span>
            </div>
            <Progress value={calcProgress(campaign.raised, campaign.target)} className="mb-2 h-3" />
            <p className="text-sm text-muted-foreground">Target: {formatNaira(campaign.target)} · {campaign.contributors} contributors</p>
          </CardContent>
        </Card>

        {va && (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
                <Building2 className="h-4 w-4" /> Payment Instructions
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Transfer to this dedicated virtual account. Your payment will be automatically reconciled.</p>
              <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Account Number</p>
                <p className="my-2 text-3xl font-bold tracking-wider">{va.accountNumber}</p>
                <p className="text-sm">{va.bankName}</p>
                <p className="text-sm text-muted-foreground">{va.accountName}</p>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <PublicCopyButton text={va.accountNumber} />
              </div>
              <p className="mt-4 text-center text-xs text-amber-700">Mock virtual account — for demo purposes only</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="font-medium">Scan to pay</p>
            <QRCodeSVG value={campaign.shareLink} size={160} />
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Secured by ThriveFund · Automatic reconciliation
        </div>
      </main>
    </div>
  );
}
