# API Endpoints — Full Reference

Complete REST API specification for ThriveFund, aligned with the [Architecture Document](../architecture-overview.md) and the React frontend dashboard.

---

## Table of Contents

1. [Conventions](#conventions)
2. [Authentication](#1-authentication)
3. [Users & Settings](#2-users--settings)
4. [Goals](#3-goals)
5. [Virtual Accounts](#4-virtual-accounts)
6. [Transactions](#5-transactions)
7. [Contributors & Invitations](#6-contributors--invitations)
8. [Dashboard & Analytics](#7-dashboard--analytics)
9. [Notifications](#8-notifications)
10. [Community & Search](#9-community--search)
11. [Public Endpoints](#10-public-endpoints)
12. [Categories & Content](#11-categories--content)
13. [Webhooks](#12-webhooks)
14. [Admin](#13-admin)
15. [Health](#14-health)
16. [Error Codes](#error-codes)
17. [Frontend → API Mapping](#frontend--api-mapping)

---

## Conventions

### Base URL

```
https://api.thrivefund.ng/api/v1
```

### Authentication

JWT Bearer token on protected routes:

```
Authorization: Bearer <access_token>
```

### Standard Response Envelope

**Success:**

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Target amount must be greater than 0",
    "details": [
      { "field": "target_amount", "message": "Must be positive" }
    ]
  }
}
```

### Pagination Query Params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `per_page` | integer | `20` | Items per page (max 100) |
| `sort` | string | `-created_at` | Sort field (`-` prefix = desc) |

### Common Filters

| Param | Used on | Description |
|-------|---------|-------------|
| `status` | goals, transactions | Filter by status |
| `category` | goals | Filter by category slug |
| `from` / `to` | transactions, analytics | ISO date range |
| `q` | search, goals | Text search |

### Roles

| Role | Access |
|------|--------|
| `user` | Own goals, accounts, transactions |
| `admin` | Platform-wide admin + reconciliation |
| `viewer` | Read-only (nice-to-have RBAC) |

---

## 1. Authentication

### `POST /auth/register`

Create a new user account.

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | `/signup` |

**Request body:**

```json
{
  "full_name": "Adebayo Okonkwo",
  "email": "adebayo@thrivefund.ng",
  "password": "SecurePass123!",
  "phone_number": "+2348034567890"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01HXYZ",
      "full_name": "Adebayo Okonkwo",
      "email": "adebayo@thrivefund.ng",
      "role": "user",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG...",
      "expires_in": 3600
    }
  }
}
```

---

### `POST /auth/login`

Authenticate and receive JWT tokens.

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | `/login` |

**Request body:**

```json
{
  "email": "adebayo@thrivefund.ng",
  "password": "SecurePass123!"
}
```

**Response `200`:** Same token structure as register.

---

### `POST /auth/refresh`

Refresh an expired access token.

| | |
|---|---|
| **Auth** | Public (requires valid refresh token) |

**Request body:**

```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "expires_in": 3600
  }
}
```

---

### `POST /auth/logout`

Invalidate refresh token.

| | |
|---|---|
| **Auth** | User |

**Response `204`:** No content.

---

### `POST /auth/forgot-password`

Send password reset link.

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | Login → "Forgot password?" |

**Request body:**

```json
{
  "email": "adebayo@thrivefund.ng"
}
```

**Response `200`:** Always returns success (prevents email enumeration).

---

### `POST /auth/reset-password`

Reset password using token from email.

| | |
|---|---|
| **Auth** | Public |

**Request body:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

---

### `GET /auth/me`

Get currently authenticated user (lightweight session check).

| | |
|---|---|
| **Auth** | User |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "usr_01HXYZ",
    "full_name": "Adebayo Okonkwo",
    "email": "adebayo@thrivefund.ng",
    "role": "user"
  }
}
```

---

## 2. Users & Settings

### `GET /users/me`

Get full user profile.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Settings page, sidebar user card |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "usr_01HXYZ",
    "first_name": "Adebayo",
    "last_name": "Okonkwo",
    "email": "adebayo@thrivefund.ng",
    "phone_number": "+2348034567890",
    "role": "user",
    "avatar_initials": "AO",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### `PATCH /users/me`

Update profile information.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Settings → Personal Information |

**Request body (partial):**

```json
{
  "first_name": "Adebayo",
  "last_name": "Okonkwo",
  "phone_number": "+2348034567890"
}
```

---

### `PATCH /users/me/password`

Change password (requires current password).

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Settings → Security |

**Request body:**

```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

---

### `GET /users/me/notification-preferences`

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Settings → Notification Preferences |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "payments": true,
    "goals": true,
    "reminders": false,
    "marketing": false
  }
}
```

---

### `PATCH /users/me/notification-preferences`

**Request body:**

```json
{
  "payments": true,
  "reminders": true
}
```

---

## 3. Goals

Core resource from architecture doc. Maps to `Goal` model.

### `POST /goals`

Create a new savings or contribution goal.

| | |
|---|---|
| **Auth** | Authenticated user |
| **Frontend** | `/dashboard/goals/create` |

**Request body:**

```json
{
  "title": "NYSC Relocation Fund",
  "description": "Saving for relocation to Abuja after NYSC",
  "target_amount": 300000,
  "category": "personal",
  "deadline": "2024-06-30",
  "color": "#00A86B"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "goal_01HXYZ",
    "title": "NYSC Relocation Fund",
    "description": "Saving for relocation to Abuja after NYSC",
    "target_amount": 300000,
    "current_amount": 0,
    "category": "personal",
    "deadline": "2024-06-30",
    "status": "active",
    "contributors_count": 0,
    "days_left": 167,
    "progress_percent": 0,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### `GET /goals`

List all goals for the authenticated user.

| | |
|---|---|
| **Auth** | Authenticated user |
| **Frontend** | `/dashboard/goals` |

**Query params:** `status`, `category`, `q`, `page`, `per_page`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "goal_01HXYZ",
      "title": "Abuja Community Water Project",
      "category": "community_project",
      "target_amount": 5000000,
      "current_amount": 3250000,
      "contributors_count": 142,
      "days_left": 45,
      "status": "active",
      "progress_percent": 65,
      "color": "#00A86B"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 6 }
}
```

---

### `GET /goals/{id}`

View goal details, balance, and summary.

| | |
|---|---|
| **Auth** | Authenticated user (owner) |
| **Frontend** | Goal detail page |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "goal_01HXYZ",
    "title": "Abuja Community Water Project",
    "description": "Community water borehole project",
    "target_amount": 5000000,
    "current_amount": 3250000,
    "remaining_amount": 1750000,
    "category": "community_project",
    "deadline": "2024-03-15",
    "status": "active",
    "contributors_count": 142,
    "days_left": 45,
    "progress_percent": 65,
    "virtual_account": {
      "id": "va_01HXYZ",
      "account_number": "0123456789",
      "account_name": "ThriveFund / Abuja Community Water",
      "bank_name": "First Bank",
      "status": "active"
    },
    "recent_transactions": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### `PATCH /goals/{id}`

Update goal fields (title, description, deadline, target).

| | |
|---|---|
| **Auth** | Owner |

**Request body (partial):**

```json
{
  "title": "Updated Goal Title",
  "deadline": "2024-12-31"
}
```

---

### `DELETE /goals/{id}`

Delete a goal. Fails if pending transactions exist.

| | |
|---|---|
| **Auth** | Owner |
| **Response** | `204` or `409` if pending transactions |

---

### `POST /goals/{id}/close`

Mark goal as completed or closed.

| | |
|---|---|
| **Auth** | Owner |

**Response `200`:** Goal with `status: "completed"`.

---

### `GET /goals/{id}/share`

Get shareable link and QR code metadata for contributors.

| | |
|---|---|
| **Auth** | Owner |
| **Frontend** | Goal detail → Share |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "public_url": "https://app.thrivefund.ng/g/nysc-relocation-fund",
    "slug": "nysc-relocation-fund",
    "qr_code_url": "https://api.thrivefund.ng/api/v1/goals/goal_01HXYZ/qr.png"
  }
}
```

---

## 4. Virtual Accounts

Dedicated Nomba virtual accounts per goal (architecture doc §7–8).

### `POST /goals/{id}/virtual-account`

Generate a dedicated virtual account via Nomba API.

| | |
|---|---|
| **Auth** | Authenticated user |
| **Frontend** | Auto-triggered on goal create, or manual regenerate |
| **Architecture** | Core MVP endpoint |

**Request body (optional):**

```json
{
  "account_name_suffix": "NYSC Relocation Fund",
  "preferred_bank": "first_bank"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "va_01HXYZ",
    "goal_id": "goal_01HXYZ",
    "nomba_account_id": "nomba_acc_abc123",
    "account_number": "0123456789",
    "account_name": "ThriveFund / NYSC Relocation Fund",
    "bank_name": "First Bank",
    "provider_reference": "NOMBA-REF-xyz",
    "status": "active",
    "created_at": "2024-01-15T10:05:00Z"
  }
}
```

**Errors:**

| Code | When |
|------|------|
| `409` | Virtual account already exists for goal |
| `502` | Nomba API failure |

---

### `GET /goals/{id}/virtual-account`

Get virtual account details for a goal.

| | |
|---|---|
| **Auth** | Owner |
| **Frontend** | `/dashboard/virtual-accounts` |

---

### `POST /goals/{id}/close-out`

Transfer collected funds to a destination bank account, expire the linked Nomba virtual account, mark the virtual account inactive, and mark the goal completed.

| | |
|---|---|
| **Auth** | Owner |
| **Frontend** | Campaign detail → Close out |
| **Provider calls** | Nomba bank transfer + expire virtual account |

**Request body:**

```json
{
  "account_number": "0123456789",
  "account_name": "Adebayo Adeyemi",
  "bank_code": "058",
  "amount": 50000,
  "narration": "Campaign payout"
}
```

`amount` is optional; when omitted, the current campaign balance is transferred.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "goal": { "id": "goal_01HXYZ", "status": "completed" },
    "virtual_account": { "id": "va_01HXYZ", "status": "inactive" },
    "transfer": {
      "provider": "nomba",
      "providerReference": "API-TRANSFER-...",
      "status": "processing",
      "amount": 50000,
      "fee": 50
    },
    "expiry": {
      "provider": "nomba",
      "expired": true,
      "providerReference": "TF-goal_01HXYZ..."
    }
  }
}
```

**Errors:**

| Code | When |
|------|------|
| `404` | Goal or active virtual account not found |
| `409` | Campaign target is not complete yet |
| `422` | Transfer amount exceeds campaign balance |
| `502` | Nomba transfer or expiry API failure |

---

## Banks

### `GET /banks/supported`

Fetch supported Nigerian banks from Nomba. Use `code` as `bank_code` for recipient lookup and close-out transfers.

| | |
|---|---|
| **Auth** | Public |
| **Provider call** | `GET /v1/transfers/banks` |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    { "code": "058", "name": "Guaranty Trust Bank" }
  ]
}
```

---

### `POST /banks/lookup`

Verify a recipient bank account before initiating a campaign close-out transfer.

| | |
|---|---|
| **Auth** | User |
| **Provider call** | `POST /v1/transfers/bank/lookup` |

**Request body:**

```json
{
  "account_number": "0123456789",
  "bank_code": "058"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "account_number": "0123456789",
    "account_name": "Adebayo Adeyemi",
    "bank_code": "058"
  }
}
```

---

### `GET /virtual-accounts`

List all virtual accounts across user's goals.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/virtual-accounts` |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "va_01HXYZ",
      "goal_id": "goal_01HXYZ",
      "goal_title": "Abuja Community Water Project",
      "account_number": "0123456789",
      "account_name": "ThriveFund / Abuja Community Water",
      "bank_name": "First Bank",
      "total_received": 3250000,
      "status": "active"
    }
  ]
}
```

---

### `GET /virtual-accounts/{id}`

Single virtual account with linked goal and recent transactions.

| | |
|---|---|
| **Auth** | Owner |

---

## 5. Transactions

Maps to `Transaction` model. Populated via Nomba webhooks.

### `GET /transactions`

List all transactions across user's goals.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/transactions` |

**Query params:** `status`, `goal_id`, `from`, `to`, `q`, `page`, `per_page`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_01HXYZ",
      "reference": "TXN-2401-001",
      "provider_reference": "REF-2401230001",
      "goal_id": "goal_01HXYZ",
      "goal_title": "Abuja Community Water Project",
      "contributor_name": "Babatunde Adeyemi",
      "amount": 50000,
      "status": "successful",
      "paid_at": "2024-01-23T14:32:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 8 }
}
```

**Status values:** `successful`, `pending`, `failed`, `duplicate`, `pending_review`

---

### `GET /transactions/{id}`

Single transaction detail.

| | |
|---|---|
| **Auth** | User (owner of linked goal) |

---

### `GET /goals/{id}/transactions`

List transactions for a specific goal.

| | |
|---|---|
| **Auth** | Owner |
| **Architecture** | Core MVP endpoint |
| **Frontend** | Goal detail, dashboard recent transactions |

---

### `GET /transactions/export`

Export transactions as CSV.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Nice-to-have |
| **Query params** | `goal_id`, `from`, `to`, `status` |
| **Response** | `200` with `Content-Type: text/csv` |

---

## 6. Contributors & Invitations

Maps to `Contributor` model.

### `GET /contributors`

List contributors across all user goals.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/contributors` |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ctr_01HXYZ",
      "name": "Babatunde Adeyemi",
      "email": "babatunde.a@gmail.com",
      "total_contributed": 350000,
      "goals_count": 3,
      "last_contribution_at": "2024-01-23T14:32:00Z",
      "avatar_initials": "BA"
    }
  ]
}
```

---

### `GET /goals/{id}/contributors`

Contributors for a specific goal.

| | |
|---|---|
| **Auth** | Owner |

---

### `POST /goals/{id}/contributors`

Manually add a contributor profile (pre-invite).

| | |
|---|---|
| **Auth** | Owner |

**Request body:**

```json
{
  "name": "Chioma Nwosu",
  "email": "chioma.nwosu@yahoo.com",
  "phone_number": "+2348012345678"
}
```

---

### `POST /goals/{id}/invitations`

Send invitation via email or SMS (mock for hackathon).

| | |
|---|---|
| **Auth** | Owner |
| **Frontend** | Invite Contributors feature |

**Request body:**

```json
{
  "recipients": [
    { "email": "contributor@example.com", "name": "John Doe" }
  ],
  "channel": "email",
  "message": "Please contribute to our community water project."
}
```

---

### `GET /goals/{id}/invitations`

List sent invitations and their status.

| | |
|---|---|
| **Auth** | Owner |

---

## 7. Dashboard & Analytics

### `GET /dashboard/overview`

Aggregated stats for the main dashboard.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard` stat cards |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "total_saved": 18400000,
    "total_saved_change_percent": 23,
    "active_goals": 5,
    "active_goals_change": 2,
    "contributors_count": 910,
    "contributors_change_percent": 14,
    "this_month_amount": 4100000,
    "this_month_change_percent": 20,
    "recent_transactions": [],
    "recent_goals": []
  }
}
```

---

### `GET /analytics/monthly-contributions`

Monthly contribution chart data.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Dashboard chart, `/dashboard/analytics` |
| **Query params** | `months` (default 6) |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    { "month": "2024-08", "amount": 1200000 },
    { "month": "2024-09", "amount": 1850000 }
  ]
}
```

---

### `GET /analytics/category-breakdown`

Contributions grouped by goal category.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/analytics` pie chart |

---

### `GET /analytics/top-contributors`

Top donors by total contributed amount.

| | |
|---|---|
| **Auth** | User |
| **Query params** | `limit` (default 10) |

---

### `GET /analytics/goal-performance`

Progress comparison across goals.

| | |
|---|---|
| **Auth** | User |

---

## 8. Notifications

### `GET /notifications`

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/notifications` |
| **Query params** | `unread_only`, `page` |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ntf_01HXYZ",
      "type": "payment",
      "title": "Payment received",
      "body": "Babatunde Adeyemi contributed ₦50,000 to Abuja Community Water Project",
      "unread": true,
      "created_at": "2024-01-23T14:34:00Z"
    }
  ]
}
```

**Types:** `payment`, `goal`, `contributor`, `reminder`, `system`

---

### `GET /notifications/unread-count`

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Sidebar badge (3) |

**Response `200`:**

```json
{ "success": true, "data": { "count": 3 } }
```

---

### `PATCH /notifications/{id}/read`

Mark single notification as read.

---

### `POST /notifications/read-all`

Mark all notifications as read.

---

## 9. Community & Search

### `GET /community-projects`

Goals filtered to community/religious categories.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | `/dashboard/community` |
| **Query params** | `category=community_project,religious` |

---

### `GET /search`

Global search across goals, transactions, contributors.

| | |
|---|---|
| **Auth** | User |
| **Frontend** | Header search bar |
| **Query params** | `q` (required), `type` (optional: `goals`, `transactions`, `contributors`) |

---

## 10. Public Endpoints

Nice-to-have: public contribution page shareable with contributors.

### `GET /public/goals/{slug}`

Public goal page (no auth).

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | Shared contribution link |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "title": "NYSC Relocation Fund",
    "description": "Help Adebayo relocate after NYSC",
    "target_amount": 300000,
    "current_amount": 150000,
    "progress_percent": 50,
    "deadline": "2024-06-30",
    "allow_anonymous": true
  }
}
```

---

### `GET /public/goals/{slug}/virtual-account`

Bank details for contributors to make transfer.

| | |
|---|---|
| **Auth** | Public |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "account_number": "0123456789",
    "account_name": "ThriveFund / NYSC Relocation Fund",
    "bank_name": "First Bank"
  }
}
```

---

## 11. Categories & Content

### `GET /categories`

Goal categories for create-goal form.

| | |
|---|---|
| **Auth** | Public |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    { "slug": "community_project", "label": "Community Project" },
    { "slug": "wedding", "label": "Wedding" },
    { "slug": "religious", "label": "Religious" },
    { "slug": "education", "label": "Education" },
    { "slug": "business", "label": "Business" },
    { "slug": "personal", "label": "Personal" }
  ]
}
```

---

### `GET /banks/supported`

Partner banks (from FAQ: First Bank, GTBank, Zenith, UBA, Access).

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | Landing FAQ |

---

### `GET /content/faqs`

FAQ content for landing page.

| | |
|---|---|
| **Auth** | Public |
| **Frontend** | Landing page FAQ section |

---

## 12. Webhooks

### `POST /webhooks/nomba`

Receive Nomba payment webhook events.

| | |
|---|---|
| **Auth** | Nomba signature validation |
| **Architecture** | Core MVP endpoint |
| **Caller** | Nomba (not frontend) |

See [webhooks.md](./webhooks.md) for full processing rules and example payload.

**Side effects on success:**

1. Create `WebhookEvent` record
2. Create/update `Transaction`
3. Update `Goal.current_amount`
4. Create `Notification` for goal owner
5. Optional: send email/WhatsApp alert

---

## 13. Admin

Admin/business dashboard per architecture doc §5 and §9.

### `GET /admin/overview`

Platform-wide admin dashboard.

| | |
|---|---|
| **Auth** | Admin |
| **Architecture** | Core MVP endpoint |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_goals": 3400,
    "total_transactions": 18500,
    "total_volume_ngn": 450000000,
    "pending_reconciliation": 3,
    "failed_webhooks_24h": 1
  }
}
```

---

### `GET /admin/reconciliation`

View webhook and reconciliation logs.

| | |
|---|---|
| **Auth** | Admin |
| **Architecture** | Core MVP endpoint |
| **Frontend** | `/dashboard/reconciliation` (user view) + admin view |

**Query params:** `status` (`matched`, `unmatched`, `failed`), `from`, `to`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "rec_01HXYZ",
      "webhook_event_id": "wh_01HXYZ",
      "provider_reference": "REF-2401230001",
      "account_number": "0123456789",
      "amount": 50000,
      "status": "reconciled",
      "transaction_id": "txn_01HXYZ",
      "processed_at": "2024-01-23T14:32:05Z"
    }
  ]
}
```

---

### `GET /admin/reconciliation/{id}`

Single reconciliation record with raw webhook payload.

| | |
|---|---|
| **Auth** | Admin |

---

### `POST /admin/reconciliation/{id}/resolve`

Manually resolve an unmatched webhook event.

| | |
|---|---|
| **Auth** | Admin |

**Request body:**

```json
{
  "goal_id": "goal_01HXYZ",
  "action": "match",
  "notes": "Manually matched to Abuja Water Project"
}
```

---

### `GET /admin/webhook-events`

Raw webhook audit log.

| | |
|---|---|
| **Auth** | Admin |
| **Query params** | `processed`, `event_type`, `page` |

---

### `POST /admin/webhook-events/{id}/retry`

Retry processing a failed webhook event.

| | |
|---|---|
| **Auth** | Admin |

---

### `GET /admin/users`

List all platform users.

| | |
|---|---|
| **Auth** | Admin |

---

### `GET /admin/goals`

List all goals (platform-wide).

| | |
|---|---|
| **Auth** | Admin |

---

### `GET /admin/transactions`

List all transactions (platform-wide).

| | |
|---|---|
| **Auth** | Admin |

---

## 14. Health

### `GET /health`

Basic liveness check.

| | |
|---|---|
| **Auth** | Public |

**Response `200`:** `{ "status": "ok" }`

---

### `GET /health/ready`

Readiness: database + Nomba API connectivity.

| | |
|---|---|
| **Auth** | Public |

**Response `200`:**

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "nomba_api": "ok"
  }
}
```

---

## Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body or params |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient role/permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource or business rule violation |
| 422 | `UNPROCESSABLE` | Valid syntax but business logic failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 502 | `PROVIDER_ERROR` | Nomba API failure |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Frontend → API Mapping

| Frontend route | Primary endpoints |
|----------------|-------------------|
| `/` (landing) | `GET /content/faqs`, `GET /banks/supported` |
| `/login` | `POST /auth/login` |
| `/signup` | `POST /auth/register` |
| `/dashboard` | `GET /dashboard/overview`, `GET /analytics/monthly-contributions` |
| `/dashboard/goals` | `GET /goals` |
| `/dashboard/goals/create` | `POST /goals`, `POST /goals/{id}/virtual-account` |
| `/dashboard/transactions` | `GET /transactions` |
| `/dashboard/virtual-accounts` | `GET /virtual-accounts` |
| `/dashboard/contributors` | `GET /contributors` |
| `/dashboard/analytics` | `GET /analytics/*` |
| `/dashboard/notifications` | `GET /notifications` |
| `/dashboard/community` | `GET /community-projects` |
| `/dashboard/reconciliation` | `GET /admin/reconciliation` (user-scoped variant: `GET /goals/{id}/reconciliation` — optional) |
| `/dashboard/settings` | `GET/PATCH /users/me`, `PATCH /users/me/password`, notification prefs |
| Header search | `GET /search?q=` |

### Architecture doc MVP endpoints (§9) — all covered

| Arch doc endpoint | Documented as |
|-------------------|---------------|
| `POST /api/auth/register` | `POST /auth/register` |
| `POST /api/auth/login` | `POST /auth/login` |
| `POST /api/goals` | `POST /goals` |
| `GET /api/goals` | `GET /goals` |
| `GET /api/goals/{id}` | `GET /goals/{id}` |
| `POST /api/goals/{id}/virtual-account` | `POST /goals/{id}/virtual-account` |
| `GET /api/goals/{id}/transactions` | `GET /goals/{id}/transactions` |
| `POST /api/webhooks/nomba` | `POST /webhooks/nomba` |
| `GET /api/admin/overview` | `GET /admin/overview` |
| `GET /api/admin/reconciliation` | `GET /admin/reconciliation` |

---

## Nomba Integration (External — Not ThriveFund API)

These are **outbound calls** from the ThriveFund backend to Nomba. Document in integration notes, not as ThriveFund REST routes.

| Action | Nomba API (consult docs) | Triggered by |
|--------|--------------------------|--------------|
| Authenticate | `POST /v1/auth/token/issue` | Provider token cache |
| Create virtual account for sub-account | `POST /v1/accounts/virtual/{subAccountId}` | `POST /goals/{id}/virtual-account` |
| Fetch sub-account balance | `GET /v1/accounts/{subAccountId}/balance` | Health/readiness |
| Fetch banks | `GET /v1/transfers/banks` | `GET /banks/supported` |
| Bank account lookup | `POST /v1/transfers/bank/lookup` | `POST /banks/lookup`, close-out preflight |
| Transfer to bank from sub-account | `POST /v2/transfers/bank/{subAccountId}` | `POST /goals/{id}/close-out` |
| Expire virtual account | `DELETE /v1/accounts/virtual/{identifier}` | `POST /goals/{id}/close-out` |
| Webhook registration | Nomba dashboard / API | Deployment setup |

---

*Last updated: June 2026 · Nomba x DevCareer Hackathon 2026*
