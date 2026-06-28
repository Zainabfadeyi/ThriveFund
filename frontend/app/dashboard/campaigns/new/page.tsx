'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewCampaignPage() {
  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/dashboard/campaigns"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>
      <PageHeader title="Create Campaign" description="Set up a new payment collection campaign" />

      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2"><label className="text-sm font-medium">Campaign Name</label><Input placeholder="e.g. Term 2 Tuition 2025/26" /></div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Type</label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tuition">Tuition Collection</SelectItem>
                <SelectItem value="membership_dues">Membership Dues</SelectItem>
                <SelectItem value="contribution">Contribution Campaign</SelectItem>
                <SelectItem value="event_payment">Event Payment</SelectItem>
                <SelectItem value="project_fundraising">Project Fundraising</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Target Amount (₦)</label><Input type="number" placeholder="5000000" /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Description</label><Input placeholder="What is this campaign for?" /></div>
          <Button className="w-full" asChild><Link href="/dashboard/campaigns">Create Campaign (Mock)</Link></Button>
          <p className="text-xs text-muted-foreground">Will connect to POST /api/v1/goals when backend is wired</p>
        </CardContent>
      </Card>
    </div>
  );
}
