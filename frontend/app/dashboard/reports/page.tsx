import { Download, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reports, monthlyCollections, campaigns } from '@/lib/mock-data';
import { formatNaira, calcProgress } from '@/lib/utils';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Download payment summaries, outstanding reports, and campaign analytics" />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Collection Trend</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={monthlyCollections} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {campaigns.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.organizationName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{calcProgress(c.raised, c.target)}%</p>
                  <p className="text-xs text-muted-foreground">{formatNaira(c.raised)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Downloadable Reports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.generatedAt} · {r.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{r.format.toUpperCase()}</Badge>
                <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Download</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
