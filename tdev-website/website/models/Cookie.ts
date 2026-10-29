import { action, computed, observable } from 'mobx';
import type CookieStore from '../stores/CookieStore';
import { COOKIE_EXTENSION, type CookieClick, type CookieKey } from '../pyodide/cookie-klicker/protocol';
import type { EventSource } from '@tdev/pyodide-code/events';

const CLICK_EVENT: CookieClick = { type: 'click', payload: null };

export default class Cookie {
    @observable accessor rotation = 0;
    readonly eventSource: EventSource;

    constructor(
        readonly id: string,
        readonly store: CookieStore
    ) {
        this.eventSource = { extension: COOKIE_EXTENSION, targetId: id };
    }

    @computed
    get isConnected(): boolean {
        return this.store.pyodideStore?.events.isConnected(this.eventSource) ?? false;
    }

    @computed
    get rotationTransform(): string {
        return `rotate(${this.rotation} 100 100)`;
    }

    @action
    setRotation(rotation: number) {
        this.rotation = rotation;
    }

    handleClick = () => {
        void this.store.pyodideStore?.events.emit(this.eventSource, CLICK_EVENT);
    };

    handleKey(key: string) {
        const event: CookieKey = { type: 'key', payload: { key } };
        void this.store.pyodideStore?.events.emit(this.eventSource, event);
    }
}
