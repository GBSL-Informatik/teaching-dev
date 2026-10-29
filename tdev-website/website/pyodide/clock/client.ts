import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { ClockUpdate } from './protocol';
import ClockStore from './ClockStore';

export default defineClientExtension<ClockUpdate, ClockStore>({
    createStore: () => new ClockStore(),
    handleMessage: (store, { targetId, payload }) => {
        const clock = store.useClock(targetId);
        if (payload.hours !== undefined) {
            clock.setHours(payload.hours);
        }
        if (payload.minutes !== undefined) {
            clock.setMinutes(payload.minutes);
        }
        if (payload.seconds !== undefined) {
            clock.setSeconds(payload.seconds);
        }
    }
});
