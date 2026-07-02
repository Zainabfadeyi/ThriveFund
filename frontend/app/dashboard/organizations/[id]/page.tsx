import OrganizationDetailClient from './client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function OrganizationDetailPage() {
  return <OrganizationDetailClient />;
}
