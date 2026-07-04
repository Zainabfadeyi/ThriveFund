'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/shared/query-states';
import { useCreateGoal, useCreateVirtualAccount, useOrganizations, usePayoutFeeInfo } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { formatNaira } from '@/lib/utils';

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
  const createVa = useCreateVirtualAccount();
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const { data: payoutInfo } = usePayoutFeeInfo();
  const transferFee = payoutInfo?.transfer_fee_ngn ?? 50;
  const [form, setForm] = useState({
    organization_id: '',
    title: '',
    description: '',
    net_payout_amount: '',
    category: 'community_project',
    deadline: '',
  });

  const netAmount = Number(form.net_payout_amount) || 0;
  const collectionTarget = useMemo(
    () => (netAmount > 0 ? netAmount + transferFee : 0),
    [netAmount, transferFee],
  );

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
    if (netAmount < 1) {
      toast.error('Enter the amount you want to receive after payout fees');
      return;
    }
    try {
      const res = await createGoal.mutateAsync({
        organization_id: form.organization_id,
        title: form.title,
        description: form.description || undefined,
        target_amount: collectionTarget,
        category: form.category,
        deadline: form.deadline,
      });
      try {
        await createVa.mutateAsync(res.data.id);
        toast.success('Collection ready to share');
      } catch {
        toast.success('Collection created. Generate the collection account on the next screen.');
      }
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
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Amount you want to receive (₦)"
                value={form.net_payout_amount}
                onChange={(e) => setForm({ ...form, net_payout_amount: e.target.value })}
                required
                min={1}
              />
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-foreground">Collection target (what contributors pay)</p>
                <p className="mt-1 text-muted-foreground">
                  {collectionTarget > 0 ? (
                    <>
                      {formatNaira(collectionTarget)} = {formatNaira(netAmount)} for you + {formatNaira(transferFee)} Nomba transfer fee
                    </>
                  ) : (
                    <>We add a {formatNaira(transferFee)} payout transfer fee so you receive your full target amount.</>
                  )}
                </p>
              </div>
            </div>
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            <Button type="submit" className="w-full" disabled={createGoal.isPending || createVa.isPending || !form.organization_id}>
              {createGoal.isPending || createVa.isPending ? 'Preparing collection...' : 'Create Collection'}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
