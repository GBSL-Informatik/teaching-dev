import { defineWorkerExtension, type WorkerContext } from '@tdev/pyodide-code/extensions';
import { DEFAULT_COOKIE_COLOR, type CookieUpdate } from './protocol';

export default defineWorkerExtension<CookieUpdate>((context) => {
    const cookies = new Map<string, ReturnType<typeof createCookie>>();
    return {
        cookie_klicker: {
            use_cookie: (id: string) => {
                const existingCookie = cookies.get(id);
                if (existingCookie) {
                    return existingCookie;
                }
                const cookie = createCookie(context, id);
                cookies.set(id, cookie);
                return cookie;
            }
        }
    };
});

const createCookie = (context: WorkerContext<CookieUpdate>, id: string) => {
    const events = context.events.source(id);
    let rotation = 0;
    let color = DEFAULT_COOKIE_COLOR;
    return {
        events,
        get rotation() {
            return rotation;
        },
        get color() {
            return color;
        },
        set_rotation: (value: number) => {
            if (!Number.isFinite(value)) {
                throw new Error('Cookie rotation must be a finite number.');
            }
            rotation = ((value % 360) + 360) % 360;
            context.send(id, { rotation });
        },
        set_color: (value: string) => {
            if (typeof value !== 'string' || !value.trim()) {
                throw new Error('Cookie color must be a non-empty CSS color string.');
            }
            color = value;
            context.send(id, { color });
        }
    };
};
