export declare class LedgrError extends Error {
    readonly status: number;
    readonly code: string;
    readonly requestId: string | null;
    constructor(status: number, code: string, message: string, requestId: string | null);
}
//# sourceMappingURL=error.d.ts.map