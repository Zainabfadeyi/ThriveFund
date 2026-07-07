'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, getAuthErrorMessage } from '@/contexts/auth-context';
import { toast } from 'sonner';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const ORG_TYPES = ['school', 'mosque', 'church', 'cooperative', 'association', 'ngo', 'business', 'event', 'other'];

export default function SignupPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    organization_name: '',
    organization_type: 'ngo',
    organization_description: '',
    organization_email: '',
    organization_phone: '',
    organization_address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(form.password));
  const passwordsMatch = form.password === form.confirm_password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number || undefined,
        organization_name: form.organization_name,
        organization_type: form.organization_type,
        organization_description: form.organization_description || undefined,
        organization_email: form.organization_email || undefined,
        organization_phone: form.organization_phone || undefined,
        organization_address: form.organization_address || undefined,
      });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-2xl space-y-8 py-8">
        <div className="flex justify-center"><Logo /></div>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Create your organization portal and start collecting campaign payments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setPasswordFocused(true)}
                  required
                />
                {(passwordFocused && form.password.length > 0) && (
                  <ul className="mt-2 space-y-1 rounded-lg border bg-muted/40 p-3">
                    {PASSWORD_RULES.map((rule) => {
                      const passing = rule.test(form.password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-2 text-xs ${passing ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passing
                            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  required
                />
                {form.confirm_password.length > 0 && (
                  <p className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                    {passwordsMatch
                      ? <><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</>
                      : <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>}
                  </p>
                )}
              </div>
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Type</label>
                  <Select value={form.organization_type} onValueChange={(v) => setForm({ ...form, organization_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Email</label>
                  <Input type="email" value={form.organization_email} onChange={(e) => setForm({ ...form, organization_email: e.target.value })} placeholder={form.email || undefined} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Phone</label>
                  <Input value={form.organization_phone} onChange={(e) => setForm({ ...form, organization_phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input value={form.organization_address} onChange={(e) => setForm({ ...form, organization_address: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={form.organization_description} onChange={(e) => setForm({ ...form, organization_description: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" type="submit" disabled={submitting || !passwordValid || !passwordsMatch || !form.organization_name}>
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
