'use client';

import { useState } from 'react';
import { Bell, Copy, FileSpreadsheet, Mail, QrCode, Send, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGoals, useGoalInvitations, useSendInvitations, useGoalShare, useGoalContributorsSummary, useSendOutstandingReminders } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { formatNaira } from '@/lib/utils';

type ImportRecipient = {
  email: string;
  name?: string;
  phone_number?: string;
  group_label?: string;
  expected_amount?: number;
  valid: boolean;
  error?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDelimitedRows(text: string) {
  const delimiter = text.includes('\t') ? '\t' : ',';
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function parseRecipientsFile(text: string): ImportRecipient[] {
  const rows = parseDelimitedRows(text);
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeHeader);
  const emailIndex = headers.findIndex((h) => ['email', 'emailaddress', 'mail'].includes(h));
  const nameIndex = headers.findIndex((h) => ['name', 'fullname', 'studentname', 'membername'].includes(h));
  const phoneIndex = headers.findIndex((h) => ['phone', 'phonenumber', 'mobile', 'mobilenumber'].includes(h));
  const groupIndex = headers.findIndex((h) => ['group', 'class', 'department', 'level', 'arm'].includes(h));
  const amountIndex = headers.findIndex((h) => ['amount', 'expectedamount', 'due', 'dues', 'tuition', 'fee', 'fees'].includes(h));
  const hasHeader = emailIndex >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const resolvedEmailIndex = hasHeader ? emailIndex : 1;
  const resolvedNameIndex = hasHeader ? nameIndex : 0;
  const seen = new Set<string>();

  return dataRows.map((row) => {
    const email = (row[resolvedEmailIndex] ?? '').trim().toLowerCase();
    const name = (row[resolvedNameIndex] ?? '').trim();
    const phone_number = phoneIndex >= 0 ? (row[phoneIndex] ?? '').trim() : undefined;
    const group_label = groupIndex >= 0 ? (row[groupIndex] ?? '').trim() : undefined;
    const rawAmount = amountIndex >= 0 ? (row[amountIndex] ?? '').replace(/[₦,\s]/g, '') : '';
    const expected_amount = rawAmount ? Number(rawAmount) : undefined;

    if (!email) return { email, name, valid: false, error: 'Missing email' };
    if (!emailPattern.test(email)) return { email, name, valid: false, error: 'Invalid email' };
    if (rawAmount && (!Number.isFinite(expected_amount) || Number(expected_amount) <= 0)) return { email, name, valid: false, error: 'Invalid amount' };
    if (seen.has(email)) return { email, name, valid: false, error: 'Duplicate email' };

    seen.add(email);
    return {
      email,
      name: name || undefined,
      phone_number: phone_number || undefined,
      group_label: group_label || undefined,
      expected_amount,
      valid: true,
    };
  });
}

export default function InvitationsPage() {
  const { data: goalsData, isLoading } = useGoals();
  const goals = goalsData?.data ?? [];
  const [goalId, setGoalId] = useState('');
  const selectedGoal = goalId || goals[0]?.id || '';
  const { data: invitations } = useGoalInvitations(selectedGoal);
  const { data: share } = useGoalShare(selectedGoal);
  const { data: summary } = useGoalContributorsSummary(selectedGoal);
  const sendInv = useSendInvitations(selectedGoal);
  const sendReminders = useSendOutstandingReminders(selectedGoal);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [importedRecipients, setImportedRecipients] = useState<ImportRecipient[]>([]);

  const shareLink = share?.public_url ?? '';
  const validImportedRecipients = importedRecipients.filter((row) => row.valid);

  const handleSend = async () => {
    if (!selectedGoal || !email) return;
    try {
      await sendInv.mutateAsync({ recipients: [{ email, name: name || undefined }], channel: 'email' });
      toast.success('Invitation sent');
      setEmail('');
      setName('');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const rows = parseRecipientsFile(text);
    setImportedRecipients(rows);
    const validCount = rows.filter((row) => row.valid).length;
    toast.success(`${validCount} valid recipient${validCount === 1 ? '' : 's'} imported`);
  };

  const handleSendImported = async () => {
    if (!selectedGoal || !validImportedRecipients.length) return;
    try {
      await sendInv.mutateAsync({
        recipients: validImportedRecipients.map((r) => ({
          email: r.email,
          name: r.name,
          phone_number: r.phone_number,
          group_label: r.group_label,
          expected_amount: r.expected_amount,
        })),
        channel: 'email',
      });
      toast.success(`${validImportedRecipients.length} invitation${validImportedRecipients.length === 1 ? '' : 's'} sent`);
      setImportedRecipients([]);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,phone,group,expected_amount\nAmina Yusuf,amina@example.com,+2348012345678,SS2A,50000\nChinedu Okafor,chinedu@example.com,+2348098765432,Computer Science,15000\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thrivefund-recipient-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendReminders = async () => {
    if (!selectedGoal) return;
    try {
      const res = await sendReminders.mutateAsync();
      toast.success(`${res.data.sent_count} reminder${res.data.sent_count === 1 ? '' : 's'} sent`);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Invitations" description="Invite students, members, parents, or contributors by email, share link, or QR code" />

      <div className="mb-6">
        <Select value={selectedGoal} onValueChange={setGoalId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Select collection" /></SelectTrigger>
          <SelectContent>{goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!goals.length ? (
        <EmptyState title="No collections" description="Create a collection first to send invitations." />
      ) : (
        <>
          {summary ? (
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expected</p><p className="text-xl font-bold">{formatNaira(Number(summary.total_expected))}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Collected</p><p className="text-xl font-bold text-primary">{formatNaira(Number(summary.total_collected))}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-xl font-bold">{formatNaira(Number(summary.outstanding_amount))}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Unpaid / Partial</p><p className="text-xl font-bold">{Number(summary.unpaid_count) + Number(summary.partial_count)}</p></CardContent></Card>
            </div>
          ) : null}

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Send Email Invitation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Contributor email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Contributor name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                <Button className="w-full" onClick={handleSend} disabled={sendInv.isPending || !email}><Mail className="h-4 w-4" /> Send Invitation</Button>
                <Button className="w-full" variant="outline" onClick={handleSendReminders} disabled={sendReminders.isPending || !summary || Number(summary.unpaid_count) + Number(summary.partial_count) === 0}>
                  <Bell className="h-4 w-4" /> Remind Unpaid / Partial
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Import Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV or TSV exported from Excel, Google Sheets, or a school/department list. Supported columns: `name`, `email`, `phone`, `group`, `expected_amount`.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>Download Template</Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      Upload File
                      <input
                        type="file"
                        accept=".csv,.tsv,text/csv,text/tab-separated-values"
                        className="hidden"
                        onChange={(e) => {
                          handleImportFile(e.target.files?.[0]);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </Button>
                  <Button onClick={handleSendImported} disabled={sendInv.isPending || !validImportedRecipients.length}>
                    <Send className="h-4 w-4" /> Send {validImportedRecipients.length || ''} Invites
                  </Button>
                </div>
                {importedRecipients.length ? (
                  <div className="max-h-56 overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Group</TableHead><TableHead>Expected</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {importedRecipients.map((row, index) => (
                          <TableRow key={`${row.email}-${index}`}>
                            <TableCell>{row.name || '—'}</TableCell>
                            <TableCell className="max-w-[220px] truncate">{row.email || '—'}</TableCell>
                            <TableCell>{row.group_label || '—'}</TableCell>
                            <TableCell>{row.expected_amount ? formatNaira(row.expected_amount) : '—'}</TableCell>
                            <TableCell><StatusBadge status={row.valid ? 'ready' : row.error ?? 'invalid'} /></TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setImportedRecipients((current) => current.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Share Link</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {shareLink ? (
                  <>
                    <p className="w-full break-all rounded-lg border bg-slate-50 p-3 text-sm">{shareLink}</p>
                    <QRCodeSVG value={shareLink} size={140} />
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied'); }}><Copy className="h-4 w-4" /> Copy Link</Button>
                  </>
                ) : <p className="text-sm text-muted-foreground">Loading share link...</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Sent Invitations</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {!invitations?.length ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No invitations sent yet</TableCell></TableRow>
                  ) : invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>{inv.name ?? '—'}</TableCell>
                      <TableCell>{inv.channel}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
