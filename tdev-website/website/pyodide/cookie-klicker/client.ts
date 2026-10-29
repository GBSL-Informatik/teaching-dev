import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { CookieUpdate } from './protocol';
import CookieStore from './CookieStore';

export default defineClientExtension<CookieUpdate, CookieStore>({
    createStore: (context) => new CookieStore(context),
    handleMessage: (store, { targetId, payload }) => {
        const cookie = store.useCookie(targetId);
        if (payload.rotation !== undefined) {
            cookie.setRotation(payload.rotation);
        }
        if (payload.color !== undefined) {
            cookie.setColor(payload.color);
        }
    }
});
