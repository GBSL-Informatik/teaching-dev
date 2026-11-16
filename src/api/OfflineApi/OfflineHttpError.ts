import type { OfflineResponse } from './RouteTable';

const ERROR_NAMES: Record<number, string> = {
    400: 'BAD REQUEST',
    403: 'FORBIDDEN',
    404: 'NOT FOUND'
};

/**
 * Thrown by offline route handlers to answer with an error status.
 * The adapter responds with the same error body as the backend.
 */
export default class OfflineHttpError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }

    toResponse(): OfflineResponse {
        return {
            status: this.status,
            statusText: this.message,
            data: {
                errors: [
                    {
                        name: ERROR_NAMES[this.status] ?? 'INTERNAL SERVER ERROR',
                        message: `[${this.status}] ${this.message}`,
                        status: this.status,
                        isOperational: true
                    }
                ]
            }
        };
    }
}
