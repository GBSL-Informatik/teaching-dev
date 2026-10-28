import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { CookieUpdate } from './protocol';

export default defineClientExtension<CookieUpdate>(({ root }, { targetId, payload }) => {
    root.siteStore.cookieStore.useCookie(targetId).setRotation(payload.rotation);
});
