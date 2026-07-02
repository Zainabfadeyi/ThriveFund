'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizations, useCreateOrganization } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { formatNaira } from '@/lib/utils';

const ORG_TYPES = ['school', 'mosque', 'church', 'cooperative', 'association', 'ngo', 'business', 'event', 'other'];

export default function OrganizationsPage() {
  const { data: orgs, isLoading, error, refetch } = useOrganizations();
  const createOrg = useCreateOrganization();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'school', description: '' });

  const handleCreate = async () => {
    try {
      await createOrg.mutateAsync(form);
      toast.success('Organization created');
      setShowForm(false);
      setForm({ name: '', type: 'school', description: '' });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage schools, mosques, cooperatives, NGOs, and more"
        action={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> New Organization</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-6">
            <Input placeholder="Organization name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button onClick={handleCreate} disabled={createOrg.isPending || !form.name}>Create</Button>
          </CardContent>
        </Card>
      )}

      {!orgs?.length ? (
        <EmptyState title="No organizations" description="Create an organization to group campaigns and members." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{org.type}</Badge>
                </div>
                <h3 className="mb-1 text-lg font-semibold">{org.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{org.description ?? 'No description'}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Campaigns</p>
                    <p className="font-semibold">{org.campaigns_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className="font-semibold">{org.active_campaigns ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Raised</p>
                    <p className="font-semibold">{formatNaira(Number(org.total_collected ?? 0))}</p>
                  </div>
                </div>
                <Button className="mt-5 w-full" variant="outline" asChild>
                  <Link href={`/dashboard/organizations/${org.id}`}>Open Portal <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
