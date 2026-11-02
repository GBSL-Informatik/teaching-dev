import { defineWorkerExtension } from '@tdev/pyodide-code/extensions';
import type { ClockTime, ClockUpdate } from './protocol';

export default defineWorkerExtension<ClockUpdate>((context) => ({
    clock: {
        use_clock: (id: string) => {
            const time: ClockTime = { hours: 0, minutes: 0, seconds: 0 };
            const update = (values: Partial<ClockTime>) => {
                Object.assign(time, values);
                context.send(id, values);
            };
            return {
                get hours() {
                    return time.hours;
                },
                get minutes() {
                    return time.minutes;
                },
                get seconds() {
                    return time.seconds;
                },
                reset: () => update({ hours: 0, minutes: 0, seconds: 0 }),
                set_time: (hours: number, minutes: number, seconds: number) =>
                    update({ hours, minutes, seconds }),
                set_hours: (hours: number) => update({ hours }),
                set_minutes: (minutes: number) => update({ minutes }),
                set_seconds: (seconds: number) => update({ seconds })
            };
        }
    }
}));
