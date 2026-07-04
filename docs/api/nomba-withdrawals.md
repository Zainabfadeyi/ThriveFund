# Nomba Withdrawal Flow

This note documents the distinction between campaign virtual accounts and payout transfers.

## Source of Funds

Campaign virtual accounts are collection addresses. Contributors transfer into the campaign virtual account, and Nomba settles those inflows into the configured ThriveFund sub-account balance.

Withdrawals do not transfer money out of the campaign virtual account number directly. A withdrawal debits the configured Nomba sub-account and sends funds to the organizer's verified bank account using:

`POST /v2/transfers/bank/{subAccountId}`

The request must include the parent business `accountId` header and the configured sub-account ID in the path.

## Transfer Payload

Nomba's bank transfer payload expects the payout amount as the NGN amount, not kobo:

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

`merchantTxRef` is the idempotency key for the payout. If Nomba returns `201 PROCESSING` or `PENDING_BILLING`, keep the withdrawal in processing state and wait for webhook confirmation instead of retrying with a new reference.

## Virtual Account Expiry

Expiring a campaign virtual account only stops new collections to that account. It does not move funds. ThriveFund should expire the virtual account after the payout is accepted or confirmed successful, not before the transfer request is made.

## User-Facing Language

Do not expose internal Nomba wallet or settlement-wallet wording to organizers. The dashboard should use neutral language such as "settled payout balance" or simply cap the displayed "available to withdraw" amount.
