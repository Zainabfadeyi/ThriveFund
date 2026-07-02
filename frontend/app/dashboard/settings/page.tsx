'use client';

import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, getAuthErrorMessage } from '@/contexts/auth-context';
import {
  useBanks,
  useCreatePayoutAccount,
  useDeletePayoutAccount,
  usePayoutAccounts,
  useSetDefaultPayoutAccount,
  useVerifyPayoutAccount,
} from '@/hooks/use-api';
import { usersApi } from '@/lib/api/services';

function maskAccount(account: string) {
  return account.length > 4 ? `**** ${account.slice(-4)}` : account;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { data: banks } = useBanks();
  const { data: payoutAccounts } = usePayoutAccounts();
  const verifyPayout = useVerifyPayoutAccount();
  const createPayout = useCreatePayoutAccount();
  const setDefault = useSetDefaultPayoutAccount();
  const deletePayout = useDeletePayoutAccount();
  const [profile, setProfile] = useState({ full_name: user?.full_name ?? '', phone_number: user?.phone_number ?? '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [payout, setPayout] = useState({ bank_code: '', account_number: '' });
  const [verified, setVerified] = useState<null | {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name?: string | null;
  }>(null);

  if (!user) return <LoadingState />;

  const selectedBank = banks?.find((bank) => bank.code === payout.bank_code);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile({ full_name: profile.full_name, phone_number: profile.phone_number || undefined });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      await usersApi.changePassword(passwords);
      toast.success('Password updated');
      setPasswords({ current_password: '', new_password: '' });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  const verifyAccount = async () => {
    try {
      const res = await verifyPayout.mutateAsync(payout);
      setVerified({ ...res.data, bank_name: selectedBank?.name ?? res.data.bank_name });
      toast.success('Account verified');
    } catch (err) {
      setVerified(null);
      toast.error(getAuthErrorMessage(err));
    }
  };

  const savePayout = async () => {
    if (!verified) return;
    try {
      await createPayout.mutateAsync({
        account_number: verified.account_number,
        bank_code: verified.bank_code,
        bank_name: verified.bank_name ?? selectedBank?.name,
        account_name: verified.account_name,
        is_default: true,
      });
      setPayout({ bank_code: '', account_number: '' });
      setVerified(null);
      toast.success('Payout account saved');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Profile, account security, and payout destination" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold">Profile</h3>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Full name" />
              <Input value={user.email} disabled />
              <Input value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} placeholder="Phone number" />
              <Button onClick={saveProfile} disabled={saving}>Save Profile</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold">Change Password</h3>
              <Input type="password" placeholder="Current password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
              <Input type="password" placeholder="New password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
              <Button variant="outline" onClick={changePassword}>Update Password</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Payout Account</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <Select value={payout.bank_code} onValueChange={(v) => { setPayout({ ...payout, bank_code: v }); setVerified(null); }}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>
                  {banks?.map((bank) => <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                value={payout.account_number}
                onChange={(e) => { setPayout({ ...payout, account_number: e.target.value }); setVerified(null); }}
                placeholder="Account number"
              />
            </div>
            <Button variant="outline" onClick={verifyAccount} disabled={!payout.bank_code || payout.account_number.length < 10 || verifyPayout.isPending}>
              Verify Account
            </Button>

            {verified && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> {verified.account_name}
                </div>
                <p className="mt-1">{verified.bank_name ?? selectedBank?.name ?? verified.bank_code} · {verified.account_number}</p>
                <Button className="mt-4" onClick={savePayout} disabled={createPayout.isPending}>Save as Default Payout</Button>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Saved Accounts</h4>
              {!payoutAccounts?.length ? (
                <p className="text-sm text-muted-foreground">No payout account saved yet.</p>
              ) : payoutAccounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{account.account_name}</p>
                    <p className="text-sm text-muted-foreground">{account.bank_name ?? account.bank_code} · {maskAccount(account.account_number)}</p>
                    {Boolean(account.is_default) && <p className="mt-1 text-xs font-medium text-primary">Default payout account</p>}
                  </div>
                  <div className="flex gap-2">
                    {!Boolean(account.is_default) && (
                      <Button size="sm" variant="outline" onClick={() => setDefault.mutate(account.id)}>Make Default</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => deletePayout.mutate(account.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
