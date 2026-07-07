'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, getAuthErrorMessage } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
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
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your organization dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
              </p>
            </form>

            <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Demo credentials — admin only
              </p>
              <p className="mb-3 text-xs text-amber-600 dark:text-amber-500">
                These credentials give access to the admin dashboard. To collect funds as a customer, please{' '}
                <Link href="/signup" className="underline hover:text-amber-800">sign up</Link> for a free account.
              </p>
              <button
                type="button"
                onClick={() => { setEmail('admin@thrivefund.ng'); setPassword('DemoPass123!'); }}
                className="flex w-full items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-gray-300 dark:hover:bg-amber-900/40"
              >
                <span>
                  <span className="block font-medium">admin@thrivefund.ng</span>
                  <span className="text-gray-400">{'•'.repeat(12)}</span>
                </span>
                <span className="ml-2 shrink-0 text-amber-600 dark:text-amber-400">Click to fill ↑</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
