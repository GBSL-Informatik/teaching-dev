import type { PyodideAPI } from 'pyodide';
import type { PyCallable, PyProxy } from 'pyodide/ffi';

const CREATE_BACKEND = `
import asyncio, time
from pyodide.code import eval_code_async
from pyodide.ffi import can_run_sync, run_sync

async def create_backend(bridge):
    original_sleep = time.sleep
    current_task = None
    supports_interrupts = can_run_sync()

    def sleep(seconds, /):
        # Delegate unusual arguments and timer-overflow durations to Python.
        if (not can_run_sync() or current_task is None or
            type(seconds) not in (int, float) or not 0 <= seconds <= 2147483):
            return original_sleep(seconds)
        if not run_sync(bridge.sleep(seconds)):
            raise asyncio.CancelledError()

    if supports_interrupts:
        # Cached imports retain this worker-lifetime dispatcher across runs.
        time.sleep = sleep

    async def execute(code, namespace, filename):
        nonlocal current_task
        current_task = asyncio.create_task(eval_code_async(code, namespace, filename=filename))
        try:
            return await current_task
        except asyncio.CancelledError:
            return None
        finally:
            current_task = None

    def cancel():
        if current_task is not None:
            current_task.cancel()

    return {"execute": execute, "cancel": cancel, "supports_interrupts": supports_interrupts}

create_backend
`;

export default class PythonExecutor {
    supportsInterrupts = false;
    private executeCode!: PyCallable;
    private cancelTask!: PyCallable;
    private executionId: number | null = null;
    private cancelled = false;
    private readonly sleepers = new Set<() => void>();

    static async create(pyodide: PyodideAPI): Promise<PythonExecutor> {
        const executor = new PythonExecutor();
        const namespace = pyodide.toPy({ __name__: '_tdev_executor' });
        let factory: PyCallable | undefined;
        let backend: PyProxy | undefined;
        try {
            factory = pyodide.runPython(CREATE_BACKEND, { globals: namespace }) as PyCallable;
            backend = (await factory({ sleep: (seconds: number) => executor.sleep(seconds) })) as PyProxy;
            executor.executeCode = backend.get('execute');
            executor.cancelTask = backend.get('cancel');
            executor.supportsInterrupts = backend.get('supports_interrupts');
            return executor;
        } finally {
            backend?.destroy();
            factory?.destroy();
            namespace.destroy();
        }
    }

    begin(executionId: number) {
        if (this.executionId !== null) {
            throw new Error('Python worker is already executing a script.');
        }
        this.executionId = executionId;
        this.cancelled = false;
    }

    async execute(code: string, globals: PyProxy, filename: string): Promise<unknown> {
        if (this.cancelled) {
            return;
        }
        return await this.executeCode(code, globals, filename);
    }

    cancel(executionId: number) {
        if (this.executionId !== executionId) {
            return;
        }
        this.cancelled = true;
        this.finishSleeps();
        this.cancelTask();
    }

    finish(executionId: number) {
        if (this.executionId !== executionId) {
            return;
        }
        this.cancelled = true;
        this.finishSleeps();
        this.executionId = null;
    }

    private sleep(seconds: number): Promise<boolean> {
        return new Promise((resolve) => {
            const finish = (completed: boolean) => {
                clearTimeout(timer);
                this.sleepers.delete(cancel);
                resolve(completed);
            };
            const cancel = () => finish(false);
            const timer = setTimeout(() => finish(true), seconds * 1000);
            this.sleepers.add(cancel);
            if (this.cancelled) {
                cancel();
            }
        });
    }

    private finishSleeps() {
        for (const cancel of [...this.sleepers]) {
            cancel();
        }
    }
}
