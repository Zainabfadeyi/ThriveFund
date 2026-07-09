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

const CHART_MONTHS = 4;

function buildChartData(monthly: { month: string; amount: number }[] | undefined) {
  const now = new Date();
  return Array.from({ length: CHART_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (CHART_MONTHS - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' }) + ` '${String(d.getFullYear()).slice(2)}`;
    const found = monthly?.find((m) => m.month === key);
    return { month: label, amount: found ? Number(found.amount) : 0 };
  });
}

export default function AnalyticsPage() {
  const { data: monthly, isLoading, error, refetch } = useAnalyticsMonthly();
  const { data: categories } = useAnalyticsCategories();
  const { data: top } = useAnalyticsTopContributors();
  const { data: performance } = useAnalyticsGoalPerformance();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  const chartData = buildChartData(monthly);

  return (
    <div>
      <PageHeader title="Analytics" description="Contribution trends and campaign performance" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Contributions — Last 4 Months</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={chartData} /></CardContent>
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
          <CardContent className="space-y-5">
            {!performance?.length ? <p className="text-sm text-muted-foreground">No campaigns yet</p> : performance.map((g) => {
              const pct = Math.min(Number(g.progress_percent ?? 0), 100);
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-muted-foreground">{formatNaira(Number(g.current_amount))} · {pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
