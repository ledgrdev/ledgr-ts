import { LedgrError } from './error';
import type {
  Program, CreateProgramParams, UpdateProgramParams,
  Entity, EntitySearchResult, CreateEntityParams, UpdateEntityParams,
  FundDefundParams, FundDefundTransaction,
  Transaction, TransactionGroup, JournalEntry, Posting,
  CreateTransactionParams, UpdateTransactionParams, ListTransactionsParams,
  Hold, CreateHoldParams, CaptureHoldParams, ReleaseHoldParams, CaptureResult,
  WebhookEndpoint, CreateEndpointParams, UpdateEndpointParams, Delivery, Event,
  ReconciliationReport,
  BalanceHistoryPoint, FlowEdge,
  Pagination,
} from './types';

const DEFAULT_BASE_URL = 'https://api.ledgr.dev';

export interface LedgrConfig {
  apiKey: string;
  baseUrl?: string;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
  programId?: string;
  idempotencyKey?: string;
}

export class Ledgr {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: LedgrConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  // -------------------------------------------------------------------------
  // HTTP
  // -------------------------------------------------------------------------

  private async request<T>(opts: RequestOptions): Promise<T> {
    const url = new URL(`/v1${opts.path}`, this.baseUrl);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (opts.programId) headers['program_id'] = opts.programId;
    if (opts.idempotencyKey) headers['idempotency_key'] = opts.idempotencyKey;

    const res = await fetch(url.toString(), {
      method: opts.method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const json = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      throw new LedgrError(
        res.status,
        (json.status as string) || 'unknown_error',
        (json.message as string) || res.statusText,
        (json.request_id as string) || null,
      );
    }

    return json as T;
  }

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------

  readonly programs = {
    create: (params: CreateProgramParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; program: Program }>({
        method: 'POST', path: '/program', body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.program),

    get: (programId: string) =>
      this.request<{ status: string; program: Program }>({
        method: 'GET', path: '/program', programId,
      }).then(r => r.program),

    list: (params?: { limit?: number; cursor?: string }) =>
      this.request<{ status: string; programs: Program[]; pagination: Pagination }>({
        method: 'GET', path: '/programs', query: params,
      }).then(r => ({ programs: r.programs, pagination: r.pagination })),

    update: (programId: string, params: UpdateProgramParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; program: Program }>({
        method: 'PUT', path: '/program', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.program),
  };

  // -------------------------------------------------------------------------
  // Entities (accounts)
  // -------------------------------------------------------------------------

  readonly entities = {
    create: (programId: string, params: CreateEntityParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; entity: Entity }>({
        method: 'POST', path: '/entity', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.entity),

    get: (programId: string, entityId: string) =>
      this.request<{ status: string; entity: Entity }>({
        method: 'GET', path: '/entity', programId, query: { entity_id: entityId },
      }).then(r => r.entity),

    list: (programId: string) =>
      this.request<{ status: string; entities: Entity[] }>({
        method: 'GET', path: '/entity', programId,
      }).then(r => r.entities),

    search: (programId: string, query: string, limit?: number) =>
      this.request<{ status: string; entities: EntitySearchResult[] }>({
        method: 'GET', path: '/entity', programId,
        query: { search: query, limit },
      }).then(r => r.entities),

    update: (programId: string, params: UpdateEntityParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; entity: { entity_id: string } }>({
        method: 'PUT', path: '/entity', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.entity),

    fund: (programId: string, params: FundDefundParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; transaction: { credit: FundDefundTransaction } }>({
        method: 'POST', path: '/entity/fund', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.transaction.credit),

    defund: (programId: string, params: FundDefundParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; transaction: { debit: FundDefundTransaction } }>({
        method: 'POST', path: '/entity/defund', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.transaction.debit),

    postings: (programId: string, entityId: string, params?: { limit?: number; cursor?: string }) =>
      this.request<{ status: string; postings: Posting[]; pagination: Pagination }>({
        method: 'GET', path: '/entity/postings', programId,
        query: { entity_id: entityId, ...params },
      }).then(r => ({ postings: r.postings, pagination: r.pagination })),

    balanceHistory: (programId: string, params?: { days?: number; entity_id?: string }) =>
      this.request<{ status: string; history: BalanceHistoryPoint[] }>({
        method: 'GET', path: '/balances/history', programId, query: params,
      }).then(r => r.history),

    flow: (programId: string, entityId: string) =>
      this.request<{ status: string; center: string; edges: FlowEdge[] }>({
        method: 'GET', path: '/flow', programId, query: { entity_id: entityId },
      }).then(r => ({ center: r.center, edges: r.edges })),
  };

  // -------------------------------------------------------------------------
  // Transactions
  // -------------------------------------------------------------------------

  readonly transactions = {
    create: (programId: string, params: CreateTransactionParams, opts?: { idempotencyKey?: string }) =>
      this.request<{
        status: string;
        transaction_group_id: string;
        transactions: Array<{
          transaction_id: string; entity_id: string; direction: string;
          amount: number; status: string; transaction_group_id: string;
        }>;
      }>({
        method: 'POST', path: '/transaction', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => ({
        transaction_group_id: r.transaction_group_id,
        transactions: r.transactions,
      })),

    update: (programId: string, params: UpdateTransactionParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string }>({
        method: 'PUT', path: '/transaction', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }),

    get: (programId: string, entityId: string, transactionId: string) =>
      this.request<{ status: string; transaction: Transaction }>({
        method: 'GET', path: '/transaction', programId,
        query: { entity_id: entityId, transaction_id: transactionId },
      }).then(r => r.transaction),

    list: (programId: string, params?: ListTransactionsParams) =>
      this.request<{ status: string; transactions: Transaction[]; pagination: Pagination }>({
        method: 'GET', path: '/transactions', programId,
        query: params as unknown as Record<string, string | number | undefined>,
      }).then(r => ({ transactions: r.transactions, pagination: r.pagination })),

    group: (programId: string, groupId: string) =>
      this.request<{ status: string; group: TransactionGroup }>({
        method: 'GET', path: '/transaction/group', programId, query: { id: groupId },
      }).then(r => r.group),

    journal: (programId: string, params?: { limit?: number; cursor?: string }) =>
      this.request<{ status: string; entries: JournalEntry[]; pagination: Pagination }>({
        method: 'GET', path: '/journal', programId, query: params,
      }).then(r => ({ entries: r.entries, pagination: r.pagination })),
  };

  // -------------------------------------------------------------------------
  // Holds
  // -------------------------------------------------------------------------

  readonly holds = {
    create: (programId: string, params: CreateHoldParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; hold: Hold }>({
        method: 'POST', path: '/hold', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.hold),

    capture: (programId: string, params: CaptureHoldParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; hold: Hold; transaction: CaptureResult['transaction'] }>({
        method: 'POST', path: '/hold/capture', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => ({ hold: r.hold, transaction: r.transaction })),

    release: (programId: string, params: ReleaseHoldParams, opts?: { idempotencyKey?: string }) =>
      this.request<{ status: string; hold: Hold }>({
        method: 'POST', path: '/hold/release', programId,
        body: params as unknown as Record<string, unknown>,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => r.hold),

    expire: (programId: string) =>
      this.request<{ status: string; expired_count: number }>({
        method: 'POST', path: '/holds/expire', programId,
      }).then(r => r.expired_count),

    get: (programId: string, holdId: string) =>
      this.request<{ status: string; hold: Hold }>({
        method: 'GET', path: '/hold', programId, query: { hold_id: holdId },
      }).then(r => r.hold),

    list: (programId: string, params?: { entity_id?: string; limit?: number; cursor?: string }) =>
      this.request<{ status: string; holds: Hold[]; pagination: Pagination }>({
        method: 'GET', path: '/holds', programId, query: params,
      }).then(r => ({ holds: r.holds, pagination: r.pagination })),
  };

  // -------------------------------------------------------------------------
  // Webhooks
  // -------------------------------------------------------------------------

  readonly webhooks = {
    create: (params: CreateEndpointParams) =>
      this.request<{ status: string; endpoint: WebhookEndpoint }>({
        method: 'POST', path: '/webhooks', body: params as unknown as Record<string, unknown>,
      }).then(r => r.endpoint),

    list: () =>
      this.request<{ status: string; endpoints: WebhookEndpoint[] }>({
        method: 'GET', path: '/webhooks',
      }).then(r => r.endpoints),

    get: (endpointId: string) =>
      this.request<{ status: string; endpoint: WebhookEndpoint; stats: unknown; series: unknown }>({
        method: 'GET', path: '/webhook', query: { id: endpointId },
      }).then(r => ({ endpoint: r.endpoint, stats: r.stats, series: r.series })),

    update: (params: UpdateEndpointParams) =>
      this.request<{ status: string; endpoint: WebhookEndpoint }>({
        method: 'PUT', path: '/webhooks', body: params as unknown as Record<string, unknown>,
      }).then(r => r.endpoint),

    delete: (endpointId: string) =>
      this.request<{ status: string }>({
        method: 'DELETE', path: '/webhooks', query: { endpoint_id: endpointId },
      }),

    rollSecret: (endpointId: string) =>
      this.request<{ status: string; secret: string }>({
        method: 'POST', path: '/webhooks/roll', body: { endpoint_id: endpointId },
      }).then(r => r.secret),

    deliveries: (endpointId: string, params?: { limit?: number; cursor?: string }) =>
      this.request<{ status: string; deliveries: Delivery[]; pagination: Pagination }>({
        method: 'GET', path: '/webhooks/deliveries',
        query: { endpoint_id: endpointId, ...params },
      }).then(r => ({ deliveries: r.deliveries, pagination: r.pagination })),

    resend: (deliveryId: string) =>
      this.request<{ status: string; delivery_id: string }>({
        method: 'POST', path: '/webhooks/resend', body: { delivery_id: deliveryId },
      }).then(r => r.delivery_id),
  };

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  readonly events = {
    list: (params?: { limit?: number; cursor?: string }) =>
      this.request<{ status: string; events: Event[]; pagination: Pagination }>({
        method: 'GET', path: '/events', query: params,
      }).then(r => ({ events: r.events, pagination: r.pagination })),

    get: (eventId: string) =>
      this.request<{ status: string; event: Event; deliveries: Delivery[] }>({
        method: 'GET', path: '/event', query: { id: eventId },
      }).then(r => ({ event: r.event, deliveries: r.deliveries })),
  };

  // -------------------------------------------------------------------------
  // Reconciliation
  // -------------------------------------------------------------------------

  readonly reconciliation = {
    get: (programId: string) =>
      this.request<{ status: string; reconciliation: ReconciliationReport }>({
        method: 'GET', path: '/reconciliation', programId,
      }).then(r => r.reconciliation),

    rebuild: (programId: string, opts?: { idempotencyKey?: string }) =>
      this.request<{
        status: string; rebuilt: boolean; repaired_accounts: number;
        reconciliation: ReconciliationReport['integrity'];
      }>({
        method: 'POST', path: '/reconciliation/rebuild', programId,
        idempotencyKey: opts?.idempotencyKey,
      }).then(r => ({
        rebuilt: r.rebuilt,
        repaired_accounts: r.repaired_accounts,
        reconciliation: r.reconciliation,
      })),
  };
}
