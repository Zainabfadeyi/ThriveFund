/** Backend API response shapes (snake_case from DB) */

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthPayload {
  user: User;
  organization?: Organization;
  tokens: AuthTokens;
}

export interface Bank {
  code: string;
  name: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: 'user' | 'admin';
  email_verified_at?: string | null;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  owner_email?: string;
  owner_name?: string;
  campaigns_count?: number;
  total_collected?: number;
  total_target?: number;
  active_campaigns?: number;
  completed_campaigns?: number;
  campaigns?: Goal[];
  recent_transactions?: Transaction[];
}

export interface PayoutFeeInfo {
  transfer_fee_ngn: number;
  description: string;
}

export interface Goal {
  id: string;
  user_id: string;
  organization_id?: string | null;
  organization_name?: string | null;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  category: string;
  status: string;
  deadline?: string | null;
  slug?: string | null;
  color?: string | null;
  days_left?: number;
  progress_percent?: number;
  contributors_count?: number;
  remaining_amount?: number;
  payout_fee_ngn?: number;
  net_payout_target?: number;
  estimated_net_available?: number;
  excess_amount?: number;
  completed_at?: string | null;
  closed_at?: string | null;
  collection_expires_at?: string | null;
  collection_grace_days?: number;
  created_at?: string;
  owner_email?: string;
  virtual_account?: VirtualAccount | null;
}

export interface VirtualAccount {
  id: string;
  goal_id: string;
  provider: string;
  provider_account_id?: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  provider_reference?: string;
  status?: string;
  goal_title?: string;
  expired_at?: string | null;
  created_at?: string;
}

export interface PayoutAccount {
  id: string;
  user_id: string;
  organization_id?: string | null;
  provider: string;
  bank_code: string;
  bank_name?: string | null;
  account_number: string;
  account_name: string;
  is_default: boolean | number;
  verified_at?: string | null;
  created_at?: string;
}

export interface Withdrawal {
  id: string;
  goal_id: string;
  organization_id?: string | null;
  user_id: string;
  payout_account_id: string;
  provider: string;
  provider_reference?: string | null;
  amount: number;
  fee?: number | null;
  status: string;
  failure_reason?: string | null;
  goal_title?: string;
  bank_name?: string | null;
  account_number?: string;
  account_name?: string;
  created_at?: string;
  processed_at?: string | null;
}

export interface WithdrawalAvailability {
  campaign_collected: number;
  campaign_reserved: number;
  campaign_available: number;
  nomba_balance: number | null;
  transfer_fee_reserve: number;
  max_withdrawable: number;
  nomba_balance_available?: boolean;
  settlement_lag?: boolean;
  pending_wallet_commitment?: number;
  balance_error?: string | null;
}

export interface Transaction {
  id: string;
  goal_id: string;
  contributor_name: string;
  amount: number;
  reference: string;
  provider_reference?: string;
  status: string;
  paid_at?: string;
  goal_title?: string;
  organization_name?: string;
  owner_email?: string;
  reconciliation_status?: string;
}

export interface Contributor {
  id: string;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  group_label?: string | null;
  expected_amount?: number | null;
  payment_status?: string;
  goals_count?: number;
  total_contributed?: number;
  last_contribution_at?: string | null;
  avatar_initials?: string;
}

export interface ReconciliationRecord {
  id: string;
  payment_id?: string;
  status: string;
  amount?: number;
  payer_name?: string;
  reference?: string;
  provider_reference?: string;
  goal_title?: string;
  organization_name?: string;
  notes?: string;
  created_at?: string;
  processed_at?: string | null;
}

export interface ReconciliationOverview {
  matched: number;
  unmatched: number;
  manual: number;
  failed: number;
  pending: number;
  auto_match_rate: string;
}

export interface DashboardOverview {
  total_saved: number;
  active_goals: number;
  contributors_count: number;
  this_month_amount: number;
  recent_transactions: Transaction[];
  recent_goals: Goal[];
}

export interface DashboardBootstrap {
  overview: DashboardOverview;
  reconciliation: ReconciliationOverview;
  monthly_contributions: MonthlyContribution[];
  goals: Goal[];
  goals_meta: PaginationMeta;
  payout_accounts: PayoutAccount[];
}

export interface GoalOverview {
  goal: Goal;
  virtual_account: VirtualAccount | null;
  transactions: Transaction[];
  transactions_meta: PaginationMeta;
  contributors: Contributor[];
  share: ShareLink;
  payout_accounts: PayoutAccount[];
  withdrawals: Withdrawal[];
  withdrawal_availability: WithdrawalAvailability;
}

export interface FinancialSummary {
  total_goals: number;
  active_goals: number;
  total_collected: number;
  total_target: number;
  total_transactions: number;
  total_contributors: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  goal_id: string;
  email: string;
  name?: string | null;
  channel: string;
  status: string;
  created_at?: string;
}

export interface ShareLink {
  public_url: string;
  slug: string;
  qr_code_url: string;
}

export interface ContributorSummary {
  total_payers: number;
  total_expected: number;
  total_collected: number;
  outstanding_amount: number;
  unpaid_count: number;
  partial_count: number;
  paid_count: number;
  overpaid_count: number;
}

export interface AdminOverview {
  total_users: number;
  total_organizations?: number;
  total_goals: number;
  total_transactions: number;
  total_volume_ngn?: number;
  total_withdrawals?: number;
  total_payouts_ngn?: number;
  pending_reconciliation?: number;
  failed_webhooks_24h?: number;
  reconciliation: ReconciliationOverview;
}

export interface AdminUser extends User {
  organizations_count?: number;
  campaigns_count?: number;
  total_collected?: number;
}

export interface AdminWithdrawal extends Withdrawal {
  goal_title?: string;
  owner_email?: string;
  owner_name?: string;
  organization_name?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

export interface RealtimeEvent {
  type: 'campaign.balance_updated' | 'campaign.completed' | 'transaction.created' | 'webhook.failed' | 'connected';
  user_id?: string;
  organization_id?: string | null;
  goal_id?: string;
  data: Record<string, unknown>;
}

export interface MonthlyContribution {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage?: number;
}

export interface TopContributor {
  contributor_name: string;
  total: number;
  goals_count?: number;
}

export interface GoalPerformance {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  status: string;
}

export interface PublicPaymentActivity {
  id: string;
  amount: number;
  status: string;
  paid_at?: string;
}

export interface PublicGoal extends Goal {
  organization_name?: string;
  recent_payments?: PublicPaymentActivity[];
}
