'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGoals } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function CampaignsPage() {
  const { data, isLoading, error, refetch } = useGoals();
  const campaigns = data?.data ?? [];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Payment collections for tuition, department dues, levies, donations, and events"
        action={<Button asChild><Link href="/dashboard/campaigns/new"><Plus className="h-4 w-4" /> New Collection</Link></Button>}
      />

      {!campaigns.length ? (
        <EmptyState
          title="No collections yet"
          description="Create your first collection, then assign a virtual account for payments."
          action={
            <Button asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="h-4 w-4" /> Create Collection
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const progress = Number(c.progress_percent ?? 0);
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/campaigns/${c.id}`} className="text-lg font-semibold hover:text-primary">{c.title}</Link>
                      <StatusBadge status={c.status} />
                      <Badge variant="outline">{c.category}</Badge>
                      {c.organization_name && <Badge variant="secondary">{c.organization_name}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.contributors_count ?? 0} contributors · {c.days_left ?? 0} days left</p>
                    <div className="mt-3 max-w-md">
                      <Progress value={progress} />
                      <p className="mt-1 text-sm text-muted-foreground">{formatNaira(Number(c.current_amount))} of {formatNaira(Number(c.target_amount))} ({progress}%)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.slug && <Button variant="outline" size="sm" asChild><Link href={`/c/${c.slug}`}>Public Page</Link></Button>}
                    <Button size="sm" asChild><Link href={`/dashboard/campaigns/${c.id}`}>Details</Link></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
