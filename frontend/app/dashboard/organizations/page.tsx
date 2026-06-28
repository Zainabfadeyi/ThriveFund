import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { organizations, orgTypeLabels } from '@/lib/mock-data';
import { formatNaira } from '@/lib/utils';

export default function OrganizationsPage() {
  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage schools, mosques, cooperatives, NGOs, and more"
        action={<Button><Plus className="h-4 w-4" /> New Organization</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary">{orgTypeLabels[org.type]}</Badge>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-thrive-dark">{org.name}</h3>
              <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{org.description}</p>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                <div>
                  <p className="text-sm font-bold text-thrive-dark">{org.campaignsCount}</p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-thrive-dark">{org.membersCount}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{formatNaira(org.totalCollected).replace('₦', '₦')}</p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href={`/dashboard/organizations/${org.id}`}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
