'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, getAuthErrorMessage } from '@/contexts/auth-context';
import { toast } from 'sonner';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function SignupPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', phone_number: '' });
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
      });
      toast.success('Account created!');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center"><Logo /></div>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Start collecting and reconciling payments</CardDescription>
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
              <Button className="w-full" type="submit" disabled={submitting || !passwordValid || !passwordsMatch}>
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
