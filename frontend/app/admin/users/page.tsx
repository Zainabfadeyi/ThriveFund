'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminUsers } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminUsersPage() {
  const { data, isLoading, error, refetch } = useAdminUsers();
  const users = data?.data ?? [];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Users" description="All platform users with organization and campaign counts" />
      <AdminTableShell title="All Users" description={`${users.length} users on this page`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No users</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><StatusBadge status={user.role} /></TableCell>
                <TableCell>{user.organizations_count ?? 0}</TableCell>
                <TableCell>{user.campaigns_count ?? 0}</TableCell>
                <TableCell>{formatNaira(Number(user.total_collected ?? 0))}</TableCell>
                <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
