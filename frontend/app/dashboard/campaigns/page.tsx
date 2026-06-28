import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { campaigns, campaignTypeLabels } from '@/lib/mock-data';
import { calcProgress, formatNaira } from '@/lib/utils';

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Payment campaigns for fees, dues, donations, and events"
        action={<Button asChild><Link href="/dashboard/campaigns/new"><Plus className="h-4 w-4" /> New Campaign</Link></Button>}
      />

      <div className="space-y-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/campaigns/${c.id}`} className="text-lg font-semibold text-thrive-dark hover:text-primary">
                    {c.name}
                  </Link>
                  <StatusBadge status={c.status} />
                  <Badge variant="outline">{campaignTypeLabels[c.type]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.organizationName} · {c.contributors} contributors · {c.daysLeft > 0 ? `${c.daysLeft} days left` : 'Completed'}</p>
                <div className="mt-3 max-w-md">
                  <Progress value={calcProgress(c.raised, c.target)} />
                  <p className="mt-1 text-sm text-muted-foreground">{formatNaira(c.raised)} of {formatNaira(c.target)} ({calcProgress(c.raised, c.target)}%)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild><Link href={`/c/${c.slug}`}>Public Page</Link></Button>
                <Button size="sm" asChild><Link href={`/dashboard/campaigns/${c.id}`}>Details</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
