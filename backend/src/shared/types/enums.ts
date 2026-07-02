/** Domain enums — mirror database ENUM columns */

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export enum OrganizationType {
  School = 'school',
  Mosque = 'mosque',
  Church = 'church',
  Cooperative = 'cooperative',
  Association = 'association',
  Ngo = 'ngo',
  Business = 'business',
  Event = 'event',
  Other = 'other',
}

export enum OrganizationMemberRole {
  Owner = 'owner',
  Admin = 'admin',
  Treasurer = 'treasurer',
  Viewer = 'viewer',
}

export enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused',
  Cancelled = 'cancelled',
}

export enum VirtualAccountStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

export enum TransactionStatus {
  Pending = 'pending',
  Successful = 'successful',
  Failed = 'failed',
  Duplicate = 'duplicate',
  PendingReview = 'pending_review',
}

export enum PaymentStatus {
  Received = 'received',
  Verified = 'verified',
  Rejected = 'rejected',
  Duplicate = 'duplicate',
}

export enum ReconciliationStatus {
  Matched = 'matched',
  Unmatched = 'unmatched',
  Manual = 'manual',
  Failed = 'failed',
  Pending = 'pending',
}

export enum InvitationStatus {
  Sent = 'sent',
  Accepted = 'accepted',
  Declined = 'declined',
  Expired = 'expired',
}

export enum WebhookEventStatus {
  Received = 'received',
  Processed = 'processed',
  Failed = 'failed',
  Duplicate = 'duplicate',
}

export enum PaymentProviderName {
  Nomba = 'nomba',
}

export enum AuditAction {
  UserRegistered = 'user.registered',
  UserLogin = 'user.login',
  GoalCreated = 'goal.created',
  GoalUpdated = 'goal.updated',
  GoalClosedOut = 'goal.closed_out',
  GoalCompleted = 'goal.completed',
  VirtualAccountCreated = 'virtual_account.created',
  PaymentReceived = 'payment.received',
  PaymentVerified = 'payment.verified',
  ReconciliationMatched = 'reconciliation.matched',
  ReconciliationManual = 'reconciliation.manual',
  TransactionCreated = 'transaction.created',
  OrganizationCreated = 'organization.created',
  InvitationSent = 'invitation.sent',
  WebhookReceived = 'webhook.received',
  PayoutAccountCreated = 'payout_account.created',
  WithdrawalCreated = 'withdrawal.created',
  WithdrawalCompleted = 'withdrawal.completed',
  WithdrawalFailed = 'withdrawal.failed',
}
