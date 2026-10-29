import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { CookieUpdate } from './protocol';

export default defineClientExtension<CookieUpdate>(({ root }, { targetId, payload }) => {
    const cookie = root.siteStore.cookieStore.useCookie(targetId);
    if (payload.rotation !== undefined) {
        cookie.setRotation(payload.rotation);
    }
    if (payload.color !== undefined) {
        cookie.setColor(payload.color);
    }
});
