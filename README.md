# Ledgr

TypeScript client for the [Ledgr](https://ledgr.dev) double-entry ledger API.

## Install

```bash
npm install ledgr
```

## Quick start

```ts
import { Ledgr } from 'ledgr';

const ledgr = new Ledgr({ apiKey: 'sk_live_...' });

const program = await ledgr.programs.create({
  program_name: 'Payroll',
  currency_code: 'USD',
});

const alice = await ledgr.entities.create(program.program_id, {
  entity_name: 'Alice',
  entity_type: 'individual',
});

await ledgr.entities.fund(program.program_id, {
  entity_id: alice.entity_id,
  amount: 500_000, // $5,000.00 in minor units
});
```

## Configuration

```ts
const ledgr = new Ledgr({
  apiKey: 'sk_live_...',
  baseUrl: 'https://custom.enterprise.com', // optional, defaults to https://api.ledgr.dev
});
```

Enterprise customers with a dedicated deployment can point `baseUrl` at their own instance.

## Usage

Every method returns a typed promise. Write operations accept an optional `idempotencyKey` to guarantee exactly-once execution.

### Programs

```ts
// Create
const program = await ledgr.programs.create({
  program_name: 'Payments',
  currency_code: 'USD',
  program_type: 'pooled', // or 'individual'
});

// Get
const p = await ledgr.programs.get(programId);

// List
const { programs, pagination } = await ledgr.programs.list({ limit: 25 });

// Update
await ledgr.programs.update(programId, { program_name: 'Updated name' });

// Terminate
await ledgr.programs.update(programId, { terminate: true });
```

### Entities (accounts)

```ts
// Create
const entity = await ledgr.entities.create(programId, {
  entity_name: 'Alice',
  entity_type: 'individual',
});

// Get (includes balances)
const account = await ledgr.entities.get(programId, entityId);
console.log(account.balance?.available);

// List all (with balances)
const accounts = await ledgr.entities.list(programId);

// Search by name
const results = await ledgr.entities.search(programId, 'ali', 10);

// Update status or metadata
await ledgr.entities.update(programId, {
  entity_id: entityId,
  status: 'inactive',
});

// Fund (money in)
const credit = await ledgr.entities.fund(programId, {
  entity_id: entityId,
  amount: 100_000,
  description: 'Initial deposit',
});

// Defund (money out)
const debit = await ledgr.entities.defund(programId, {
  entity_id: entityId,
  amount: 50_000,
});

// Posting history
const { postings, pagination } = await ledgr.entities.postings(programId, entityId);

// Balance history (for charts)
const history = await ledgr.entities.balanceHistory(programId, { days: 30 });

// Money flow graph
const { center, edges } = await ledgr.entities.flow(programId, entityId);
```

### Transactions

Ledgr enforces the double-entry invariant: every transaction must balance (sum of debits equals sum of credits).

```ts
// Two-party shorthand
const { transaction_group_id, transactions } = await ledgr.transactions.create(programId, {
  description: 'Invoice payment',
  amount: 25_000,
  account: { from: aliceId, to: bobId },
  status: 'pending', // or 'posted'
});

// Multi-leg
await ledgr.transactions.create(programId, {
  description: 'Fee split',
  entries: [
    { entity_id: aliceId, direction: 'debit', amount: 10_000 },
    { entity_id: bobId, direction: 'credit', amount: 8_000 },
    { entity_id: feeAccountId, direction: 'credit', amount: 2_000 },
  ],
});

// Lifecycle transitions
await ledgr.transactions.update(programId, {
  transaction_group_id: groupId,
  status: 'posted', // or 'canceled', 'failed', 'reversed', 'disputed'
});

// Get single transaction
const txn = await ledgr.transactions.get(programId, entityId, transactionId);

// List transactions
const { transactions, pagination } = await ledgr.transactions.list(programId, {
  entity_id: entityId,
  status: 'posted',
  direction: 'debit',
  limit: 50,
});

// Transaction group detail (legs, events, postings)
const group = await ledgr.transactions.group(programId, groupId);

// Journal (program-wide immutable posting feed)
const { entries } = await ledgr.transactions.journal(programId, { limit: 50 });
```

### Holds

Holds reserve funds on an entity (reduces available balance) without moving posted balance.

```ts
// Create a hold
const hold = await ledgr.holds.create(programId, {
  entity_id: entityId,
  amount: 15_000,
  expires_at: '2025-12-31T23:59:59Z', // optional
  description: 'Authorization',
});

// Capture (full or partial)
const { hold: captured, transaction } = await ledgr.holds.capture(programId, {
  hold_id: hold.hold_id,
  destination_entity_id: merchantId,
  amount: 10_000, // optional, defaults to remaining
});

// Release (void remaining)
const released = await ledgr.holds.release(programId, {
  hold_id: hold.hold_id,
});

// Expire all past-due holds
const expiredCount = await ledgr.holds.expire(programId);

// Get / list
const h = await ledgr.holds.get(programId, holdId);
const { holds, pagination } = await ledgr.holds.list(programId, { entity_id: entityId });
```

### Webhooks

```ts
// Create endpoint
const endpoint = await ledgr.webhooks.create({
  url: 'https://example.com/webhooks',
  event_types: ['transaction.posted', 'hold.created'],
});
console.log(endpoint.secret); // only returned on create

// List / get / update / delete
const endpoints = await ledgr.webhooks.list();
const detail = await ledgr.webhooks.get(endpointId);
await ledgr.webhooks.update({ endpoint_id: endpointId, enabled: false });
await ledgr.webhooks.delete(endpointId);

// Roll secret
const newSecret = await ledgr.webhooks.rollSecret(endpointId);

// Delivery history
const { deliveries } = await ledgr.webhooks.deliveries(endpointId);

// Resend a failed delivery
const newDeliveryId = await ledgr.webhooks.resend(deliveryId);
```

### Events

```ts
const { events, pagination } = await ledgr.events.list({ limit: 25 });
const { event, deliveries } = await ledgr.events.get(eventId);
```

### Reconciliation

```ts
// Integrity check (journal vs cached balances + bank reconciliation)
const report = await ledgr.reconciliation.get(programId);
console.log(report.integrity.in_sync);

// Rebuild cached balances from the immutable journal
const result = await ledgr.reconciliation.rebuild(programId);
console.log(result.repaired_accounts);
```

## Idempotency

Pass an `idempotencyKey` on any write operation to guarantee exactly-once execution. If a request with the same key is retried, the original response is replayed.

```ts
const entity = await ledgr.entities.create(
  programId,
  { entity_name: 'Alice', entity_type: 'individual' },
  { idempotencyKey: 'create-alice-001' },
);
```

## Error handling

All API errors throw a `LedgrError` with the HTTP status, error code, message, and request ID.

```ts
import { LedgrError } from 'ledgr';

try {
  await ledgr.entities.defund(programId, { entity_id: entityId, amount: 999_999_999 });
} catch (err) {
  if (err instanceof LedgrError) {
    console.log(err.status);    // 400
    console.log(err.code);      // 'insufficient_funds'
    console.log(err.message);   // 'Entity has insufficient available balance...'
    console.log(err.requestId); // 'req_abc123'
  }
}
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- TypeScript 5+ (for type exports)

## License

MIT
