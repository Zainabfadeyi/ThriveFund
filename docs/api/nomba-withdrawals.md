# Nomba Withdrawal Flow

This note documents the distinction between campaign virtual accounts and payout transfers in ThriveFund.

## Source of Funds

Campaign virtual accounts are collection addresses. Contributors transfer into the campaign virtual account, and Nomba settles those inflows into the configured ThriveFund sub-account balance.

Withdrawals do not transfer money out of the campaign virtual account number directly. A withdrawal debits the configured Nomba sub-account and sends funds to the organizer's verified bank account using:

`POST /v2/transfers/bank/{subAccountId}`

The request includes the parent business `accountId` header and the configured sub-account ID in the path.

## Transfer Payload

Nomba's bank transfer payload uses the NGN amount, not kobo:

```json
{
  "amount": 3500,
  "accountNumber": "0554772814",
  "accountName": "M.A Animashaun",
  "bankCode": "058",
  "merchantTxRef": "TF-WD-example",
  "senderName": "ThriveFund",
  "narration": "ThriveFund withdrawal"
}
```

`merchantTxRef` is the idempotency key for the payout. When Nomba returns `201 PROCESSING` or `PENDING_BILLING`, ThriveFund keeps the withdrawal in processing state and waits for webhook confirmation instead of retrying with a new reference.

## Virtual Account Expiry

Expiring a campaign virtual account only stops new collections to that account. It does not move funds. ThriveFund expires the virtual account after the payout is accepted or confirmed successful, not before the transfer request is made.

## User-Facing Language

Organizer-facing screens avoid internal Nomba wallet or settlement-wallet wording. The dashboard uses neutral language such as "settled payout balance" and caps the displayed "available to withdraw" amount.
