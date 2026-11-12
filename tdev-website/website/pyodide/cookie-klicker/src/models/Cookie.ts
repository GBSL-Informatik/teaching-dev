import type { EventSource } from '@tdev/pyodide-code/events';
import { action, computed, observable } from 'mobx';
import { DEFAULT_COOKIE_COLOR, type CookieClick, type CookieKey } from '../../protocol';
import type CookieStore from '../stores/CookieStore';

export default class Cookie {
    @observable accessor rotation = 0;
    @observable accessor color = DEFAULT_COOKIE_COLOR;
    readonly eventSource: EventSource;
    readonly id: string;
    readonly store: CookieStore;
    private lastClick?: { executionId: number; timeStamp: number };

    constructor(id: string, store: CookieStore) {
        this.id = id;
        this.store = store;
        this.eventSource = { extension: store.context.name, targetId: id };
    }

    @computed
    get isConnected(): boolean {
        return this.store.context.events.isConnected(this.eventSource);
    }

    @computed
    get rotationTransform(): string {
        return `rotate(${this.rotation} 100 100)`;
    }

    @action
    setRotation(rotation: number) {
        this.rotation = rotation;
    }

    @action
    setColor(color: string) {
        this.color = color;
    }

    handleClick = () => {
        const events = this.store.context.events;
        const executionId = events.getExecutionId(this.eventSource);
        if (executionId === undefined) {
            return;
        }
        const now = Date.now();
        const previousClick =
            this.lastClick?.executionId === executionId ? this.lastClick.timeStamp : undefined;
        const timeSinceLastClick = previousClick === undefined ? -1 : (now - previousClick) / 1000;
        const event: CookieClick = {
            type: 'click',
            payload: { time_since_last_click: timeSinceLastClick }
        };
        this.lastClick = { executionId, timeStamp: now };
        void events.emit(this.eventSource, event);
    };

    handleKey(key: string) {
        const event: CookieKey = { type: 'key', payload: { key } };
        void this.store.context.events.emit(this.eventSource, event);
    }
}
