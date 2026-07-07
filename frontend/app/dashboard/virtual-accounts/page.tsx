'use client';

import { Copy, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVirtualAccounts } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function VirtualAccountsPage() {
  const { data: accounts, isLoading, error, refetch } = useVirtualAccounts();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Virtual Accounts" description="Dedicated accounts connected to campaigns" />
      {!accounts?.length ? (
        <EmptyState title="No virtual accounts" description="Create a virtual account from a campaign detail page." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((va) => (
                  <TableRow key={va.id}>
                    <TableCell><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><span className="font-mono font-medium">{va.account_number}</span></div></TableCell>
                    <TableCell>{va.bank_name}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{va.account_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{va.goal_title ?? va.goal_id}</TableCell>
                    <TableCell><StatusBadge status={String(va.status)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(va.account_number); toast.success('Copied'); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
