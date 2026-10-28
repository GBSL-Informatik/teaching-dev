import { defineWorkerExtension } from '@tdev/pyodide-code/extensions';
import type { CookieUpdate } from './protocol';

export default defineWorkerExtension<CookieUpdate>((context) => {
    const createCookie = (id: string) => {
        const events = context.events.source(id);
        let rotation = 0;
        return {
            events,
            get rotation() {
                return rotation;
            },
            set_rotation: (value: number) => {
                if (!Number.isFinite(value)) {
                    throw new Error('Cookie rotation must be a finite number.');
                }
                rotation = ((value % 360) + 360) % 360;
                context.send(id, { rotation });
            }
        };
    };
    const cookies = new Map<string, ReturnType<typeof createCookie>>();
    return {
        cookie_klicker: {
            use_cookie: (id: string) => {
                let cookie = cookies.get(id);
                if (!cookie) {
                    cookie = createCookie(id);
                    cookies.set(id, cookie);
                }
                return cookie;
            }
        }
    };
});
