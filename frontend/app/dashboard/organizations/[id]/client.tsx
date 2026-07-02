'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganization } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { formatNaira } from '@/lib/utils';

export default function OrganizationDetailClient() {
  const pathname = usePathname();
  const id = pathname.split('/').filter(Boolean).pop() ?? '';
  const { data: org, isLoading, error, refetch } = useOrganization(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;
  if (!org) return null;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/dashboard/organizations"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>

      <PageHeader
        title={org.name}
        description={`${org.type} organization portal`}
        action={<Button asChild><Link href="/dashboard/campaigns/new"><Plus className="h-4 w-4" /> New Campaign</Link></Button>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-2xl font-bold">{formatNaira(Number(org.total_collected ?? 0))}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Campaigns</p><p className="text-2xl font-bold">{org.campaigns_count ?? org.campaigns?.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{org.active_campaigns ?? org.campaigns?.filter((g) => g.status === 'active').length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{org.completed_campaigns ?? org.campaigns?.filter((g) => g.status === 'completed').length ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Campaigns</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!org.campaigns?.length ? (
              <div className="p-6"><EmptyState title="No campaigns" description="Create the first campaign for this organization." /></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Raised</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {org.campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.title}</TableCell>
                      <TableCell>{formatNaira(Number(campaign.current_amount))} / {formatNaira(Number(campaign.target_amount))}</TableCell>
                      <TableCell><StatusBadge status={campaign.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild><Link href={`/dashboard/campaigns/${campaign.id}`}>Open</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {!org.recent_transactions?.length ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No transactions yet</TableCell></TableRow>
                ) : org.recent_transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.contributor_name}</TableCell>
                    <TableCell>{formatNaira(Number(txn.amount))}</TableCell>
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
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
