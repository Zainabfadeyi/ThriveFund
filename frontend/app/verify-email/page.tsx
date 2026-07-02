'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/services';
import { getAuthErrorMessage } from '@/contexts/auth-context';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification token is missing.');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => {
        setState('success');
        setMessage('Your email has been verified.');
      })
      .catch((err) => {
        setState('error');
        setMessage(getAuthErrorMessage(err));
      });
  }, [token]);

  const Icon = state === 'success' ? CheckCircle2 : state === 'error' ? XCircle : Loader2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center"><Logo /></div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icon className={`h-6 w-6 ${state === 'loading' ? 'animate-spin text-primary' : state === 'success' ? 'text-green-600' : 'text-destructive'}`} />
            </div>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/login">{state === 'success' ? 'Continue to Login' : 'Back to Login'}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
