import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { contributors } from '@/lib/mock-data';
import { formatNaira, getInitials } from '@/lib/utils';

export default function ContributorsPage() {
  return (
    <div>
      <PageHeader title="Contributors & Members" description="Track payment status, outstanding balances, and member activity" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell className="font-medium">{formatNaira(c.totalPaid)}</TableCell>
                  <TableCell className={c.outstanding > 0 ? 'font-medium text-amber-600' : ''}>{formatNaira(c.outstanding)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastPayment ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={c.paymentStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
