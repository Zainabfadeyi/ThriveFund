'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePublicGoal, usePublicVirtualAccount } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { PublicCopyButton } from './copy-button';
import { PaymentRadar } from '@/components/campaign/payment-radar';

export default function PublicCampaignClient() {
  const { slug } = useParams<{ slug: string }>();
  const { data: campaign, isLoading, error, refetch } = usePublicGoal(slug);
  const { data: va } = usePublicVirtualAccount(slug);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><LoadingState /></div>;
  if (error || !campaign) return <div className="flex min-h-screen items-center justify-center p-6"><ErrorState message="Campaign not found" onRetry={() => refetch()} /></div>;

  const progress = Number(campaign.progress_percent ?? 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo />
          <Button variant="outline" size="sm" asChild><Link href="/login">Organizer Login</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-4 text-3xl font-bold">{campaign.title}</h1>
        <p className="mb-8 text-slate-600">{campaign.description}</p>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex justify-between text-sm">
              <span>{formatNaira(Number(campaign.current_amount))} raised</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="mb-2 h-3" />
            <p className="text-sm text-muted-foreground">Target: {formatNaira(Number(campaign.target_amount))}</p>
          </CardContent>
        </Card>
        {va ? (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary"><Building2 className="h-4 w-4" /> Payment Instructions</div>
              <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                <p className="text-xs uppercase text-muted-foreground">Account Number</p>
                <p className="my-2 text-3xl font-bold tracking-wider">{va.account_number}</p>
                <p className="text-sm">{va.bank_name}</p>
                <p className="text-sm text-muted-foreground">{va.account_name}</p>
              </div>
              <div className="mt-4 flex justify-center"><PublicCopyButton text={va.account_number} /></div>
              <div className="mt-5 rounded-lg bg-white p-4 text-sm text-slate-700">
                Transfer to this account from your bank app. Your payment will be matched automatically once received.
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6"><CardContent className="p-6 text-sm text-muted-foreground">Virtual account not yet assigned for this campaign.</CardContent></Card>
        )}
        <PaymentRadar slug={slug} />
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Secured by ThriveFund · Automatic reconciliation
        </div>
      </main>
    </div>
  );
}
