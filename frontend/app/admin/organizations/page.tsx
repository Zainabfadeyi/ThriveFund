'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminOrganizations } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminOrganizationsPage() {
  const { data: organizations, isLoading, error, refetch } = useAdminOrganizations();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Organizations" description="Every organization on the platform and what they have raised" />
      <AdminTableShell title="All Organizations">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!organizations?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No organizations</TableCell></TableRow>
            ) : organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.owner_name ?? org.owner_email ?? org.owner_id}</TableCell>
                <TableCell className="capitalize">{org.type}</TableCell>
                <TableCell>{org.email ?? '-'}</TableCell>
                <TableCell>{org.campaigns_count ?? 0}</TableCell>
                <TableCell>{formatNaira(Number(org.total_collected ?? 0))}</TableCell>
                <TableCell>{formatNaira(Number(org.total_target ?? 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
