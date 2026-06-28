'use client';

import { Copy, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { virtualAccounts } from '@/lib/mock-data';

export default function VirtualAccountsPage() {
  return (
    <div>
      <PageHeader title="Virtual Accounts" description="Dedicated mock accounts linked to campaigns — Nomba integration from July 1" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Number</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {virtualAccounts.map((va) => (
                <TableRow key={va.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{va.accountNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>{va.bankName}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{va.accountName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{va.campaignName}</TableCell>
                  <TableCell>{va.organizationName}</TableCell>
                  <TableCell><StatusBadge status={va.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(va.accountNumber)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
