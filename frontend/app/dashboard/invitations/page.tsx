'use client';

import { useState } from 'react';
import { Copy, Mail, QrCode, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { campaigns, invitations } from '@/lib/mock-data';

export default function InvitationsPage() {
  const [email, setEmail] = useState('');
  const shareLink = campaigns[0]?.shareLink ?? 'https://thrivefund.ng/c/greenfield-term-2-tuition';

  return (
    <div>
      <PageHeader title="Invitations" description="Invite contributors via email, share link, or QR code" />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Send Email Invitation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Contributor email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Contributor name" />
            <Button className="w-full"><Mail className="h-4 w-4" /> Send Invitation</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Share Link & QR</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full rounded-lg border bg-slate-50 p-3 text-sm break-all">{shareLink}</div>
            <div className="rounded-xl border bg-white p-4"><QRCodeSVG value={shareLink} size={140} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(shareLink)}><Copy className="h-4 w-4" /> Copy Link</Button>
              <Button variant="outline" asChild><a href={shareLink} target="_blank"><Share2 className="h-4 w-4" /> Open</a></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sent Invitations</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.name}</TableCell>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>{inv.campaignName}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.sentAt}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
