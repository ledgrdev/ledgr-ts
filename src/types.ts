// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export interface Pagination {
  limit: number;
  has_next: boolean;
  next_cursor: string | null;
}

export interface ApiResponse {
  status: string;
  request_id: string;
  request_time: string;
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export type ProgramType = 'pooled' | 'individual';
export type ProgramStatus = 'active' | 'terminated';

export interface Program {
  program_name: string;
  program_id: string;
  currency_code: string;
  program_type: ProgramType;
  status: ProgramStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateProgramParams {
  program_name: string;
  currency_code: string;
  program_type?: ProgramType;
  metadata?: Record<string, unknown>;
}

export interface UpdateProgramParams {
  program_name?: string;
  metadata?: Record<string, unknown> | null;
  terminate?: boolean;
}

// ---------------------------------------------------------------------------
// Entities (accounts)
// ---------------------------------------------------------------------------

export type EntityType = 'individual' | 'business';
export type EntityStatus = 'active' | 'inactive';

export interface EntityBalance {
  current: number;
  available: number;
  pending: number;
  holds: {
    disputed: number;
    pending_debits: number;
  };
}

export interface Entity {
  entity_name: string;
  entity_id: string;
  entity_type: EntityType;
  currency_code: string;
  status: EntityStatus;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
  balance?: EntityBalance;
}

export interface EntitySearchResult {
  entity_name: string;
  entity_id: string;
  entity_type: EntityType;
}

export interface CreateEntityParams {
  entity_name: string;
  entity_type: EntityType;
  metadata?: Record<string, unknown>;
}

export interface UpdateEntityParams {
  entity_id: string;
  status?: EntityStatus;
  metadata?: Record<string, unknown> | null;
}

export interface FundDefundParams {
  entity_id: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FundDefundTransaction {
  transaction_id: string;
  transaction_group_id: string;
  amount: number;
  entity_id: string;
  direction: 'credit' | 'debit';
  status: 'posted';
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export type TransactionStatus = 'pending' | 'posted' | 'failed' | 'canceled' | 'reversed' | 'disputed';
export type Direction = 'debit' | 'credit';

export interface TransactionEntry {
  entity_id: string;
  direction: Direction;
  amount: number;
  counterparty_id?: string;
}

export interface CreateTransactionParams {
  description: string;
  status?: 'pending' | 'posted';
  metadata?: Record<string, unknown>;
  account?: { from: string; to: string };
  amount?: number;
  entries?: TransactionEntry[];
}

export interface UpdateTransactionParams {
  transaction_group_id: string;
  status: 'posted' | 'failed' | 'canceled' | 'reversed' | 'disputed';
}

export interface Transaction {
  transaction_id: string;
  transaction_group_id: string;
  status: TransactionStatus;
  description: string;
  created_at: string;
  direction: Direction;
  amount: number;
  entity_id?: string;
  counterparty_id?: string;
  metadata?: Record<string, unknown> | null;
}

export interface TransactionLeg {
  transaction_id: string;
  entity_id: string;
  counterparty_id: string | null;
  direction: Direction;
  amount: number;
}

export interface TransactionEvent {
  status: TransactionStatus;
  created_at: string;
  updated_by: string | null;
}

export interface Posting {
  posting_id: string;
  entity_id: string;
  entity_name?: string | null;
  transaction_id?: string;
  transaction_group_id?: string;
  balance_type: 'posted' | 'pending' | 'held';
  direction: Direction;
  amount: number;
  currency_code: string;
  created_at: string;
}

export interface TransactionGroup {
  transaction_group_id: string;
  status: TransactionStatus;
  description: string;
  created_at: string;
  legs: TransactionLeg[];
  events: TransactionEvent[];
  postings: Posting[];
}

export interface JournalEntry {
  transaction_group_id: string;
  description: string;
  status: TransactionStatus;
  created_at: string;
  postings: Posting[];
}

export interface ListTransactionsParams {
  entity_id?: string;
  limit?: number;
  cursor?: string;
  status?: TransactionStatus;
  direction?: Direction;
  start_date?: string;
  end_date?: string;
}

// ---------------------------------------------------------------------------
// Holds
// ---------------------------------------------------------------------------

export type HoldStatus = 'held' | 'partially_captured' | 'captured' | 'released' | 'expired';

export interface Hold {
  hold_id: string;
  entity_id: string;
  currency_code: string;
  amount: number;
  captured_amount: number;
  available_to_capture: number;
  status: HoldStatus;
  expires_at: string | null;
  description: string | null;
  created_at: string;
}

export interface CreateHoldParams {
  entity_id: string;
  amount: number;
  expires_at?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CaptureHoldParams {
  hold_id: string;
  destination_entity_id: string;
  amount?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ReleaseHoldParams {
  hold_id: string;
}

export interface CaptureResult {
  hold: Hold;
  transaction: {
    transaction_group_id: string;
    amount: number;
    source: string;
    destination: string;
  };
}

// ---------------------------------------------------------------------------
// Webhooks & Events
// ---------------------------------------------------------------------------

export interface WebhookEndpoint {
  endpoint_id: string;
  name: string | null;
  url: string;
  description: string | null;
  event_types: string[] | null;
  enabled: boolean;
  created_at: string;
  secret?: string;
}

export interface CreateEndpointParams {
  url: string;
  name?: string;
  description?: string;
  event_types?: string[];
}

export interface UpdateEndpointParams {
  endpoint_id: string;
  url?: string;
  name?: string;
  description?: string;
  event_types?: string[] | null;
  enabled?: boolean;
}

export interface Delivery {
  delivery_id: string;
  event_id: string;
  event_type: string;
  status: string;
  attempts: number;
  response_status: number | null;
  response_ms: number | null;
  error: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

export interface Event {
  event_id: string;
  type: string;
  created_at: string;
  data?: Record<string, unknown>;
  deliveries?: {
    total: number;
    succeeded: number;
    failed: number;
    pending: number;
  };
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export interface ReconciliationAccount {
  entity_id: string;
  entity_name: string;
  is_external: boolean;
  currency_code: string;
  posting_count: number;
  posted: { journal: number; cached: number; delta: number };
  pending: { journal: number; cached: number; delta: number };
  held: { journal: number; cached: number; delta: number };
  ok: boolean;
}

export interface IntegrityReport {
  checked_at: string;
  in_sync: boolean;
  accounts_checked: number;
  postings_scanned: number;
  breaks_count: number;
  conservation: {
    posted: number;
    pending_outstanding: number;
    held_outstanding: number;
    balanced: boolean;
  };
  accounts: ReconciliationAccount[];
}

export interface BankReport {
  checked_at: string;
  source: string;
  total_items: number;
  matched_count: number;
  matched_amount: number;
  breaks_count: number;
  reconciled_rate: number;
  unmatched_ledger: unknown[];
  unmatched_bank: unknown[];
  mismatches: unknown[];
  matched: unknown[];
}

export interface ReconciliationReport {
  integrity: IntegrityReport;
  bank: BankReport;
}

// ---------------------------------------------------------------------------
// Balance history & flow
// ---------------------------------------------------------------------------

export interface BalanceHistoryPoint {
  date: string;
  posted: number;
  available: number;
}

export interface FlowEdge {
  counterparty_id: string;
  counterparty_name: string | null;
  direction: Direction;
  total: number;
  count: number;
}
