export type OrganizationType =
  | 'school'
  | 'mosque'
  | 'church'
  | 'cooperative'
  | 'association'
  | 'ngo'
  | 'business'
  | 'event_organizer';

export type CampaignType =
  | 'contribution'
  | 'membership_dues'
  | 'tuition'
  | 'event_payment'
  | 'project_fundraising';

export type PaymentStatus = 'successful' | 'pending' | 'failed' | 'review';
export type ReconciliationStatus = 'matched' | 'unmatched' | 'duplicate' | 'pending_review';
export type VirtualAccountStatus = 'active' | 'inactive' | 'pending';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description: string;
  email: string;
  phone: string;
  address: string;
  campaignsCount: number;
  totalCollected: number;
  membersCount: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  slug: string;
  organizationId: string;
  organizationName: string;
  name: string;
  type: CampaignType;
  category: string;
  target: number;
  raised: number;
  contributors: number;
  daysLeft: number;
  status: 'active' | 'completed' | 'draft';
  description: string;
  shareLink: string;
  virtualAccountId: string;
  createdAt: string;
}

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  campaignId: string;
  campaignName: string;
  organizationName: string;
  status: VirtualAccountStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  payer: string;
  amount: number;
  campaignId: string;
  campaignName: string;
  organizationId: string;
  organizationName: string;
  status: PaymentStatus;
  date: string;
  reconciliationStatus: ReconciliationStatus;
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  phone: string;
  organizationId: string;
  totalPaid: number;
  outstanding: number;
  lastPayment: string | null;
  paymentStatus: 'paid' | 'partial' | 'outstanding' | 'overpaid';
  campaigns: string[];
}

export interface ReconciliationRecord {
  id: string;
  reference: string;
  payer: string;
  amount: number;
  campaignName: string;
  organizationName: string;
  status: ReconciliationStatus;
  receivedAt: string;
  matchedAt: string | null;
  notes?: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: 'payment_summary' | 'outstanding' | 'campaign_performance' | 'monthly_collection';
  format: 'pdf' | 'csv' | 'xlsx';
  generatedAt: string;
  size: string;
}

export interface Invitation {
  id: string;
  email: string;
  name: string;
  campaignName: string;
  status: 'sent' | 'pending' | 'accepted';
  sentAt: string;
}

export interface DashboardStats {
  totalCollected: number;
  activeCampaigns: number;
  contributors: number;
  pendingReconciliation: number;
  reconciliationAccuracy: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalCampaigns: number;
  totalTransactions: number;
  totalVolume: number;
  activeVirtualAccounts: number;
}

export interface MonthlyCollection {
  month: string;
  amount: number;
}

export interface ReconciliationOverview {
  incoming: number;
  matched: number;
  unmatched: number;
  duplicate: number;
  pendingReview: number;
  accuracy: number;
}
