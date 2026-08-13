import type { Program, CreateProgramParams, UpdateProgramParams, Entity, EntitySearchResult, CreateEntityParams, UpdateEntityParams, FundDefundParams, FundDefundTransaction, Transaction, TransactionGroup, JournalEntry, Posting, CreateTransactionParams, UpdateTransactionParams, ListTransactionsParams, Hold, CreateHoldParams, CaptureHoldParams, ReleaseHoldParams, WebhookEndpoint, CreateEndpointParams, UpdateEndpointParams, Delivery, Event, ReconciliationReport, BalanceHistoryPoint, FlowEdge, Pagination } from './types';
export interface LedgrConfig {
    apiKey: string;
    baseUrl?: string;
}
export declare class Ledgr {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: LedgrConfig);
    private request;
    readonly programs: {
        create: (params: CreateProgramParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<Program>;
        get: (programId: string) => Promise<Program>;
        list: (params?: {
            limit?: number;
            cursor?: string;
        }) => Promise<{
            programs: Program[];
            pagination: Pagination;
        }>;
        update: (programId: string, params: UpdateProgramParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<Program>;
    };
    readonly entities: {
        create: (programId: string, params: CreateEntityParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<Entity>;
        get: (programId: string, entityId: string) => Promise<Entity>;
        list: (programId: string) => Promise<Entity[]>;
        search: (programId: string, query: string, limit?: number) => Promise<EntitySearchResult[]>;
        update: (programId: string, params: UpdateEntityParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<{
            entity_id: string;
        }>;
        fund: (programId: string, params: FundDefundParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<FundDefundTransaction>;
        defund: (programId: string, params: FundDefundParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<FundDefundTransaction>;
        postings: (programId: string, entityId: string, params?: {
            limit?: number;
            cursor?: string;
        }) => Promise<{
            postings: Posting[];
            pagination: Pagination;
        }>;
        balanceHistory: (programId: string, params?: {
            days?: number;
            entity_id?: string;
        }) => Promise<BalanceHistoryPoint[]>;
        flow: (programId: string, entityId: string) => Promise<{
            center: string;
            edges: FlowEdge[];
        }>;
    };
    readonly transactions: {
        create: (programId: string, params: CreateTransactionParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<{
            transaction_group_id: string;
            transactions: {
                transaction_id: string;
                entity_id: string;
                direction: string;
                amount: number;
                status: string;
                transaction_group_id: string;
            }[];
        }>;
        update: (programId: string, params: UpdateTransactionParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<{
            status: string;
        }>;
        get: (programId: string, entityId: string, transactionId: string) => Promise<Transaction>;
        list: (programId: string, params?: ListTransactionsParams) => Promise<{
            transactions: Transaction[];
            pagination: Pagination;
        }>;
        group: (programId: string, groupId: string) => Promise<TransactionGroup>;
        journal: (programId: string, params?: {
            limit?: number;
            cursor?: string;
        }) => Promise<{
            entries: JournalEntry[];
            pagination: Pagination;
        }>;
    };
    readonly holds: {
        create: (programId: string, params: CreateHoldParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<Hold>;
        capture: (programId: string, params: CaptureHoldParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<{
            hold: Hold;
            transaction: {
                transaction_group_id: string;
                amount: number;
                source: string;
                destination: string;
            };
        }>;
        release: (programId: string, params: ReleaseHoldParams, opts?: {
            idempotencyKey?: string;
        }) => Promise<Hold>;
        expire: (programId: string) => Promise<number>;
        get: (programId: string, holdId: string) => Promise<Hold>;
        list: (programId: string, params?: {
            entity_id?: string;
            limit?: number;
            cursor?: string;
        }) => Promise<{
            holds: Hold[];
            pagination: Pagination;
        }>;
    };
    readonly webhooks: {
        create: (params: CreateEndpointParams) => Promise<WebhookEndpoint>;
        list: () => Promise<WebhookEndpoint[]>;
        get: (endpointId: string) => Promise<{
            endpoint: WebhookEndpoint;
            stats: unknown;
            series: unknown;
        }>;
        update: (params: UpdateEndpointParams) => Promise<WebhookEndpoint>;
        delete: (endpointId: string) => Promise<{
            status: string;
        }>;
        rollSecret: (endpointId: string) => Promise<string>;
        deliveries: (endpointId: string, params?: {
            limit?: number;
            cursor?: string;
        }) => Promise<{
            deliveries: Delivery[];
            pagination: Pagination;
        }>;
        resend: (deliveryId: string) => Promise<string>;
    };
    readonly events: {
        list: (params?: {
            limit?: number;
            cursor?: string;
        }) => Promise<{
            events: Event[];
            pagination: Pagination;
        }>;
        get: (eventId: string) => Promise<{
            event: Event;
            deliveries: Delivery[];
        }>;
    };
    readonly reconciliation: {
        get: (programId: string) => Promise<ReconciliationReport>;
        rebuild: (programId: string, opts?: {
            idempotencyKey?: string;
        }) => Promise<{
            rebuilt: boolean;
            repaired_accounts: number;
            reconciliation: import("./types").IntegrityReport;
        }>;
    };
}
//# sourceMappingURL=client.d.ts.map