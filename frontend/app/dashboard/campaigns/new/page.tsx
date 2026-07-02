'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/shared/query-states';
import { useCreateGoal, useOrganizations } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';

const CATEGORIES = [
  { value: 'education', label: 'Education / Tuition' },
  { value: 'religious', label: 'Religious / Donations' },
  { value: 'community_project', label: 'Community Project' },
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal / Events' },
  { value: 'wedding', label: 'Wedding' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const createGoal = useCreateGoal();
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const [form, setForm] = useState({
    organization_id: '',
    title: '',
    description: '',
    target_amount: '',
    category: 'community_project',
    deadline: '',
  });

  useEffect(() => {
    if (!form.organization_id && organizations?.length === 1) {
      setForm((current) => ({ ...current, organization_id: organizations[0].id }));
    }
  }, [form.organization_id, organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_id) {
      toast.error('Choose an organization for this collection');
      return;
    }
    try {
      const res = await createGoal.mutateAsync({
        organization_id: form.organization_id,
        title: form.title,
        description: form.description || undefined,
        target_amount: Number(form.target_amount),
        category: form.category,
        deadline: form.deadline,
      });
      toast.success('Collection created');
      router.push(`/dashboard/campaigns/${res.data.id}`);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  if (organizationsLoading) return <LoadingState message="Loading organizations..." />;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/dashboard/campaigns"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>
      <PageHeader title="Create Collection" description="Set up tuition, dues, levies, donations, or event payments" />

      {!organizations?.length ? (
        <Card className="max-w-2xl border-primary/30">
          <CardContent className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Organization profile missing</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Collections belong to the organization created during signup. Please complete onboarding again or contact an admin if this keeps showing.
            </p>
            <Button asChild>
              <Link href="/dashboard/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              Organization: <span className="font-medium">{organizations[0].name}</span>
            </div>
            <Input placeholder="Campaign title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Target amount (₦)" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required min={1} />
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            <Button type="submit" className="w-full" disabled={createGoal.isPending || !form.organization_id}>{createGoal.isPending ? 'Creating...' : 'Create Collection'}</Button>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
