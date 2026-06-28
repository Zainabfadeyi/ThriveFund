import Link from 'next/link';
import { CheckCircle2, Download } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ContributionSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <Logo className="justify-center" />
        <Card>
          <CardContent className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-thrive-dark">Payment Received</h1>
            <p className="mb-6 text-muted-foreground">Your transfer has been recorded and is being reconciled automatically.</p>

            <div className="mb-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">REF-2606280001</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₦150,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span>Term 2 Tuition Collection</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-emerald-600 font-medium">Reconciled</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>28 Jun 2026</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline"><Download className="h-4 w-4" /> Download Receipt</Button>
              <Button asChild><Link href="/">Back to Home</Link></Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">Mock receipt — demo data only</p>
      </div>
    </div>
  );
}
