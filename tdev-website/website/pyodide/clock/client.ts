import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { ClockUpdate } from './protocol';

export default defineClientExtension<ClockUpdate>(({ root }, { targetId, payload }) => {
    const clock = root.siteStore.clockStore.useClock(targetId);
    if (payload.hours !== undefined) {
        clock.setHours(payload.hours);
    }
    if (payload.minutes !== undefined) {
        clock.setMinutes(payload.minutes);
    }
    if (payload.seconds !== undefined) {
        clock.setSeconds(payload.seconds);
    }
});
