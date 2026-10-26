import type { PyodideAPI } from 'pyodide';
import type { PyProxy } from 'pyodide/ffi';

// JSPI lets Python yield without isolation headers. Other engines use hard stop.
const RUNNER = `
import asyncio, math, operator, sys, time
from pyodide.code import eval_code_async
from pyodide.ffi import can_run_sync, run_sync

async def execute(code, namespace, filename, bridge):
    class ExecutionCancelled(BaseException):
        pass

    loop = asyncio.get_running_loop()
    previous_sleep = time.sleep
    previous_create_task = loop.create_task
    previous_call_soon = loop.call_soon
    previous_call_later = loop.call_later
    tasks = set()
    previous_tasks = asyncio.all_tasks()
    handles = set()
    cooperative = can_run_sync()
    events = 0
    last_yield = time.monotonic()

    def trace(frame, event, arg):
        nonlocal events, last_yield
        if frame.f_code.co_filename != filename:
            return None
        events += 1
        if cooperative and events % 128 == 0 and time.monotonic() - last_yield >= 0.016:
            last_yield = time.monotonic()
            if run_sync(bridge.poll()):
                raise ExecutionCancelled()
        return trace

    async def traced(coro):
        previous_trace = sys.gettrace()
        sys.settrace(trace)
        try:
            return await coro
        except ExecutionCancelled:
            raise asyncio.CancelledError() from None
        finally:
            sys.settrace(previous_trace)

    def create_task(coro, **kwargs):
        task = previous_create_task(traced(coro), **kwargs)
        tasks.add(task)
        return task

    def traced_callback(callback, args, holder):
        handles.discard(holder[0])
        previous_trace = sys.gettrace()
        sys.settrace(trace)
        try:
            return callback(*args)
        except ExecutionCancelled:
            return None
        finally:
            sys.settrace(previous_trace)

    def schedule(schedule_callback, args, kwargs):
        holder = [None]
        handle = schedule_callback(traced_callback, args[0], args[1:], holder, **kwargs)
        holder[0] = handle
        handles.add(handle)
        return handle

    def call_soon(*args, **kwargs):
        # WebLoop.call_soon calls the patched call_later; bypass double wrapping.
        return call_later(0, *args, **kwargs)

    def call_later(delay, *args, **kwargs):
        return schedule(lambda *a, **k: previous_call_later(delay, *a, **k), args, kwargs)

    def sleep(seconds):
        if not isinstance(seconds, float):
            seconds = float(operator.index(seconds))
        if math.isnan(seconds):
            raise ValueError('Invalid value NaN (not a number)')
        if math.isinf(seconds):
            raise OverflowError('timestamp out of range for platform time_t')
        if seconds < 0:
            raise ValueError('sleep length must be non-negative')
        if not run_sync(bridge.sleep(seconds)):
            raise ExecutionCancelled()

    loop.create_task = create_task
    loop.call_soon = call_soon
    loop.call_later = call_later
    if cooperative:
        time.sleep = sleep
    student = loop.create_task(eval_code_async(code, namespace, filename=filename))
    cancelled = asyncio.ensure_future(bridge.waitCancelled())
    try:
        done, _ = await asyncio.wait((student, cancelled), return_when=asyncio.FIRST_COMPLETED)
        if student not in done:
            student.cancel()
        try:
            return await student
        except asyncio.CancelledError:
            return None
    finally:
        bridge.finish()
        cancelled.cancel()
        try:
            while pending := [task for task in tasks | (asyncio.all_tasks() - previous_tasks) if not task.done()]:
                for task in pending:
                    task.cancel()
                await asyncio.gather(*pending, return_exceptions=True)
        finally:
            loop.create_task = previous_create_task
            loop.call_soon = previous_call_soon
            loop.call_later = previous_call_later
            time.sleep = previous_sleep
            for handle in handles:
                handle.cancel()

execute
`;

export class ExecutionController {
    readonly executionId: number;
    private cancelled = false;
    private readonly waiters = new Set<() => void>();
    private readonly signals = new Set<() => void>();

    constructor(executionId: number) {
        this.executionId = executionId;
    }

    cancel() {
        this.cancelled = true;
        for (const cancel of [...this.waiters]) {
            cancel();
        }
        for (const resolve of this.signals) {
            resolve();
        }
        this.signals.clear();
    }

    async execute(pyodide: PyodideAPI, code: string, globals: PyProxy, filename: string) {
        if (this.cancelled) {
            return;
        }
        const namespace = pyodide.toPy({});
        const runner = pyodide.runPython(RUNNER, { globals: namespace });
        try {
            return await runner(code, globals, filename, {
                poll: async () => {
                    await this.wait(0);
                    return this.cancelled;
                },
                sleep: async (seconds: number) => {
                    // Browser timers overflow after about 24 days.
                    let remaining = seconds * 1000;
                    do {
                        const duration = Math.min(remaining, 2147483647);
                        if (!(await this.wait(duration))) {
                            return false;
                        }
                        remaining -= duration;
                    } while (remaining > 0);
                    return true;
                },
                waitCancelled: () =>
                    new Promise<void>((resolve) => {
                        if (this.cancelled) {
                            resolve();
                        } else {
                            this.signals.add(resolve);
                        }
                    }),
                finish: () => this.cancel()
            });
        } finally {
            this.cancel();
            runner.destroy();
            namespace.destroy();
        }
    }

    private wait(milliseconds: number): Promise<boolean> {
        return new Promise((resolve) => {
            const finish = (completed: boolean) => {
                clearTimeout(timer);
                this.waiters.delete(cancel);
                resolve(completed);
            };
            const cancel = () => finish(false);
            const timer = setTimeout(() => finish(true), milliseconds);
            this.waiters.add(cancel);
            if (this.cancelled) {
                cancel();
            }
        });
    }
}
