'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialSummary, useAnalyticsMonthly, useAnalyticsGoalPerformance, useGoals } from '@/hooks/use-api';
import { reportsApi } from '@/lib/api/services';
import { downloadFile, formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function ReportsPage() {
  const { data: summary, isLoading, error, refetch } = useFinancialSummary();
  const { data: monthly } = useAnalyticsMonthly();
  const { data: performance } = useAnalyticsGoalPerformance();
  const { data: goalsData } = useGoals();
  const campaigns = goalsData?.data ?? [];
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const downloadCsv = async () => {
    try {
      const { data: csv } = await reportsApi.transactionsExport();
      downloadFile(csv, 'thrivefund-transactions.csv');
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const downloadCampaignReport = async (format: 'csv' | 'pdf') => {
    if (!selectedCampaignId) {
      toast.error('Select a campaign first');
      return;
    }

    setExporting(format);
    try {
      const { data } = await reportsApi.campaignExport(selectedCampaignId, format);
      const campaign = campaigns.find((item) => item.id === selectedCampaignId);
      const slug = campaign?.slug ?? selectedCampaignId;
      const filename = `campaign-${slug}-report.${format}`;
      if (data instanceof Blob) {
        downloadFile(data, filename);
      } else {
        downloadFile(data, filename, format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8');
      }
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Payment summaries and per-campaign reconciliation reports"
        action={
          <Button variant="outline" onClick={downloadCsv}>
            <Download className="h-4 w-4" /> Export All Transactions CSV
          </Button>
        }
      />

      <Card className="mb-8">
        <CardHeader><CardTitle>Campaign Payment Report</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="mb-2 text-sm text-muted-foreground">
              Download payer name, amount, date paid, references, and reconciliation status for one campaign.
            </p>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>{campaign.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadCampaignReport('csv')} disabled={!selectedCampaignId || exporting !== null}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => downloadCampaignReport('pdf')} disabled={!selectedCampaignId || exporting !== null}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-2xl font-bold">{formatNaira(Number(summary.total_collected))}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active Campaigns</p><p className="text-2xl font-bold">{summary.active_goals}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{summary.total_transactions}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Contributors</p><p className="text-2xl font-bold">{summary.total_contributors}</p></CardContent></Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Collections</CardTitle></CardHeader>
          <CardContent>{monthly?.length ? <MonthlyChart data={monthly.map((m) => ({ month: m.month, amount: Number(m.amount) }))} /> : <p className="text-sm text-muted-foreground">No data yet</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!performance?.length ? <p className="text-sm text-muted-foreground">No campaigns yet</p> : performance.map((c) => (
              <div key={c.id} className="flex justify-between border-b pb-3 last:border-0">
                <div><p className="text-sm font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{c.status}</p></div>
                <div className="text-right"><p className="font-semibold text-primary">{c.progress_percent}%</p><p className="text-xs">{formatNaira(Number(c.current_amount))}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
