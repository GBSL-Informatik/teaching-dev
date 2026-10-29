export const COOKIE_EXTENSION = 'cookie_klicker';
export const DEFAULT_COOKIE_COLOR = 'var(--ifm-color-warning-light)';

export interface CookieUpdate {
    rotation?: number;
    color?: string;
}

export interface CookieClick {
    type: 'click';
    payload: null;
}

export interface CookieKey {
    type: 'key';
    payload: {
        key: string;
    };
}
