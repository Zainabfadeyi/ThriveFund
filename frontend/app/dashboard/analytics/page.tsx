'use client';

import { BarChart3 } from 'lucide-react';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAnalyticsMonthly,
  useAnalyticsCategories,
  useAnalyticsTopContributors,
  useAnalyticsGoalPerformance,
} from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AnalyticsPage() {
  const { data: monthly, isLoading, error, refetch } = useAnalyticsMonthly();
  const { data: categories } = useAnalyticsCategories();
  const { data: top } = useAnalyticsTopContributors();
  const { data: performance } = useAnalyticsGoalPerformance();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Analytics" description="Contribution trends and campaign performance" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Contributions</CardTitle></CardHeader>
          <CardContent>{monthly?.length ? <MonthlyChart data={monthly.map((m) => {
          const [year, mon] = m.month.split('-');
          const label = new Date(Number(year), Number(mon) - 1).toLocaleString('default', { month: 'short' }) + ` '${year.slice(2)}`;
          return { month: label, amount: Number(m.amount) };
        })} /> : <p className="text-sm text-muted-foreground">No data yet</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> By Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!categories?.length ? <p className="text-sm text-muted-foreground">No categories yet</p> : categories.map((c, i) => (
              <div key={c.category ?? i} className="flex justify-between text-sm">
                <span className="capitalize">{(c.category ?? 'Uncategorised').replace(/_/g, ' ')}</span>
                <span className="font-medium">{formatNaira(Number(c.total))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Contributors</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!top?.length ? <p className="text-sm text-muted-foreground">No contributors yet</p> : top.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{c.contributor_name}</span>
                <span className="font-medium">{formatNaira(Number(c.total))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Goal Performance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!performance?.length ? <p className="text-sm text-muted-foreground">No campaigns yet</p> : performance.map((g) => (
              <div key={g.id} className="flex justify-between border-b pb-2 text-sm last:border-0">
                <span>{g.title}</span>
                <span>{g.progress_percent}% · {formatNaira(Number(g.current_amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
