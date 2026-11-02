export const MAX_PENDING_EVENTS = 256;

export interface EventSource {
    readonly extension: string;
    readonly targetId: string;
}

export interface ExecutionEventSource extends EventSource {
    readonly executionId: number;
}

export interface WebEvent<Payload = unknown> {
    type: string;
    payload: Payload;
}

export interface ExecutionEvent {
    editorId: string;
    executionId: number;
    extension: string;
    targetId: string;
    timeStamp: number;
    event: WebEvent;
}

export interface EventSubscriptionMessage {
    type: 'event-subscriptions';
    id: string;
    executionId: number;
    operation: 'open' | 'close';
    sources: readonly ExecutionEventSource[];
}

export type EventDeliveryResult = 'accepted' | 'inactive' | 'overflow';

export const eventSourceKey = (source: EventSource): string =>
    JSON.stringify([source.extension, source.targetId]);
