export const DEFAULT_COOKIE_COLOR = 'var(--ifm-color-warning-light)';

export interface CookieUpdate {
    rotation?: number;
    color?: string;
}

export interface CookieClick {
    type: 'click';
    payload: {
        time_since_last_click: number;
    };
}

export interface CookieKey {
    type: 'key';
    payload: {
        key: string;
    };
}
