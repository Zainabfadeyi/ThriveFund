'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function CheckEmailContent() {
  const params = useSearchParams();
  const email = params.get('email') ?? 'your inbox';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center"><Logo /></div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to confirm your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <Link href="/signup" className="text-primary hover:underline">try signing up again</Link>.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}
