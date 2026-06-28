'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center"><Logo /></div>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Start collecting and reconciling payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">Full Name</label><Input placeholder="Adebayo Okonkwo" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" placeholder="you@organization.ng" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Password</label><Input type="password" placeholder="Min. 8 characters" /></div>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>Create Account</Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
