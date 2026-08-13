"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgrError = void 0;
class LedgrError extends Error {
    status;
    code;
    requestId;
    constructor(status, code, message, requestId) {
        super(message);
        this.name = 'LedgrError';
        this.status = status;
        this.code = code;
        this.requestId = requestId;
    }
}
exports.LedgrError = LedgrError;
//# sourceMappingURL=error.js.map