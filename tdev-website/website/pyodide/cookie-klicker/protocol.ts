export const COOKIE_EXTENSION = 'cookie_klicker';

export interface CookieUpdate {
    rotation: number;
}

export interface CookieClick {
    type: 'click';
    payload: null;
}
