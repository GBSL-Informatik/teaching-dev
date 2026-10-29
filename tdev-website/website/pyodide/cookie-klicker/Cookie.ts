import type { EventSource } from '@tdev/pyodide-code/events';
import { action, computed, observable } from 'mobx';
import type CookieStore from './CookieStore';
import { DEFAULT_COOKIE_COLOR, type CookieClick, type CookieKey } from './protocol';

const CLICK_EVENT: CookieClick = { type: 'click', payload: null };

export default class Cookie {
    @observable accessor rotation = 0;
    @observable accessor color = DEFAULT_COOKIE_COLOR;
    readonly eventSource: EventSource;
    readonly id: string;
    readonly store: CookieStore;

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
        void this.store.context.events.emit(this.eventSource, CLICK_EVENT);
    };

    handleKey(key: string) {
        const event: CookieKey = { type: 'key', payload: { key } };
        void this.store.context.events.emit(this.eventSource, event);
    }
}
