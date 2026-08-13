"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ledgr = void 0;
const error_1 = require("./error");
const DEFAULT_BASE_URL = 'https://api.ledgr.dev';
class Ledgr {
    apiKey;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    }
    // -------------------------------------------------------------------------
    // HTTP
    // -------------------------------------------------------------------------
    async request(opts) {
        const url = new URL(`/v1${opts.path}`, this.baseUrl);
        if (opts.query) {
            for (const [k, v] of Object.entries(opts.query)) {
                if (v !== undefined && v !== null && v !== '')
                    url.searchParams.set(k, String(v));
            }
        }
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
        if (opts.programId)
            headers['program_id'] = opts.programId;
        if (opts.idempotencyKey)
            headers['idempotency_key'] = opts.idempotencyKey;
        const res = await fetch(url.toString(), {
            method: opts.method,
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
        });
        const json = await res.json();
        if (!res.ok) {
            throw new error_1.LedgrError(res.status, json.status || 'unknown_error', json.message || res.statusText, json.request_id || null);
        }
        return json;
    }
    // -------------------------------------------------------------------------
    // Programs
    // -------------------------------------------------------------------------
    programs = {
        create: (params, opts) => this.request({
            method: 'POST', path: '/program', body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.program),
        get: (programId) => this.request({
            method: 'GET', path: '/program', programId,
        }).then(r => r.program),
        list: (params) => this.request({
            method: 'GET', path: '/programs', query: params,
        }).then(r => ({ programs: r.programs, pagination: r.pagination })),
        update: (programId, params, opts) => this.request({
            method: 'PUT', path: '/program', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.program),
    };
    // -------------------------------------------------------------------------
    // Entities (accounts)
    // -------------------------------------------------------------------------
    entities = {
        create: (programId, params, opts) => this.request({
            method: 'POST', path: '/entity', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.entity),
        get: (programId, entityId) => this.request({
            method: 'GET', path: '/entity', programId, query: { entity_id: entityId },
        }).then(r => r.entity),
        list: (programId) => this.request({
            method: 'GET', path: '/entity', programId,
        }).then(r => r.entities),
        search: (programId, query, limit) => this.request({
            method: 'GET', path: '/entity', programId,
            query: { search: query, limit },
        }).then(r => r.entities),
        update: (programId, params, opts) => this.request({
            method: 'PUT', path: '/entity', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.entity),
        fund: (programId, params, opts) => this.request({
            method: 'POST', path: '/entity/fund', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.transaction.credit),
        defund: (programId, params, opts) => this.request({
            method: 'POST', path: '/entity/defund', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.transaction.debit),
        postings: (programId, entityId, params) => this.request({
            method: 'GET', path: '/entity/postings', programId,
            query: { entity_id: entityId, ...params },
        }).then(r => ({ postings: r.postings, pagination: r.pagination })),
        balanceHistory: (programId, params) => this.request({
            method: 'GET', path: '/balances/history', programId, query: params,
        }).then(r => r.history),
        flow: (programId, entityId) => this.request({
            method: 'GET', path: '/flow', programId, query: { entity_id: entityId },
        }).then(r => ({ center: r.center, edges: r.edges })),
    };
    // -------------------------------------------------------------------------
    // Transactions
    // -------------------------------------------------------------------------
    transactions = {
        create: (programId, params, opts) => this.request({
            method: 'POST', path: '/transaction', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => ({
            transaction_group_id: r.transaction_group_id,
            transactions: r.transactions,
        })),
        update: (programId, params, opts) => this.request({
            method: 'PUT', path: '/transaction', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }),
        get: (programId, entityId, transactionId) => this.request({
            method: 'GET', path: '/transaction', programId,
            query: { entity_id: entityId, transaction_id: transactionId },
        }).then(r => r.transaction),
        list: (programId, params) => this.request({
            method: 'GET', path: '/transactions', programId,
            query: params,
        }).then(r => ({ transactions: r.transactions, pagination: r.pagination })),
        group: (programId, groupId) => this.request({
            method: 'GET', path: '/transaction/group', programId, query: { id: groupId },
        }).then(r => r.group),
        journal: (programId, params) => this.request({
            method: 'GET', path: '/journal', programId, query: params,
        }).then(r => ({ entries: r.entries, pagination: r.pagination })),
    };
    // -------------------------------------------------------------------------
    // Holds
    // -------------------------------------------------------------------------
    holds = {
        create: (programId, params, opts) => this.request({
            method: 'POST', path: '/hold', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.hold),
        capture: (programId, params, opts) => this.request({
            method: 'POST', path: '/hold/capture', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => ({ hold: r.hold, transaction: r.transaction })),
        release: (programId, params, opts) => this.request({
            method: 'POST', path: '/hold/release', programId,
            body: params,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => r.hold),
        expire: (programId) => this.request({
            method: 'POST', path: '/holds/expire', programId,
        }).then(r => r.expired_count),
        get: (programId, holdId) => this.request({
            method: 'GET', path: '/hold', programId, query: { hold_id: holdId },
        }).then(r => r.hold),
        list: (programId, params) => this.request({
            method: 'GET', path: '/holds', programId, query: params,
        }).then(r => ({ holds: r.holds, pagination: r.pagination })),
    };
    // -------------------------------------------------------------------------
    // Webhooks
    // -------------------------------------------------------------------------
    webhooks = {
        create: (params) => this.request({
            method: 'POST', path: '/webhooks', body: params,
        }).then(r => r.endpoint),
        list: () => this.request({
            method: 'GET', path: '/webhooks',
        }).then(r => r.endpoints),
        get: (endpointId) => this.request({
            method: 'GET', path: '/webhook', query: { id: endpointId },
        }).then(r => ({ endpoint: r.endpoint, stats: r.stats, series: r.series })),
        update: (params) => this.request({
            method: 'PUT', path: '/webhooks', body: params,
        }).then(r => r.endpoint),
        delete: (endpointId) => this.request({
            method: 'DELETE', path: '/webhooks', query: { endpoint_id: endpointId },
        }),
        rollSecret: (endpointId) => this.request({
            method: 'POST', path: '/webhooks/roll', body: { endpoint_id: endpointId },
        }).then(r => r.secret),
        deliveries: (endpointId, params) => this.request({
            method: 'GET', path: '/webhooks/deliveries',
            query: { endpoint_id: endpointId, ...params },
        }).then(r => ({ deliveries: r.deliveries, pagination: r.pagination })),
        resend: (deliveryId) => this.request({
            method: 'POST', path: '/webhooks/resend', body: { delivery_id: deliveryId },
        }).then(r => r.delivery_id),
    };
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    events = {
        list: (params) => this.request({
            method: 'GET', path: '/events', query: params,
        }).then(r => ({ events: r.events, pagination: r.pagination })),
        get: (eventId) => this.request({
            method: 'GET', path: '/event', query: { id: eventId },
        }).then(r => ({ event: r.event, deliveries: r.deliveries })),
    };
    // -------------------------------------------------------------------------
    // Reconciliation
    // -------------------------------------------------------------------------
    reconciliation = {
        get: (programId) => this.request({
            method: 'GET', path: '/reconciliation', programId,
        }).then(r => r.reconciliation),
        rebuild: (programId, opts) => this.request({
            method: 'POST', path: '/reconciliation/rebuild', programId,
            idempotencyKey: opts?.idempotencyKey,
        }).then(r => ({
            rebuilt: r.rebuilt,
            repaired_accounts: r.repaired_accounts,
            reconciliation: r.reconciliation,
        })),
    };
}
exports.Ledgr = Ledgr;
//# sourceMappingURL=client.js.map