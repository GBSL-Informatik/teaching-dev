import type { Context, Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import type { PyodideAPI } from 'pyodide';
import type { PyProxy } from 'pyodide/ffi';
import { loadPyodide } from '../loadPyodide';
import { loadPackages } from './helper.loadPackages';
import { configureInput } from './input';
import { captureOutput } from './output';
import { registerJsModule } from './registerJsModule';
import PythonExecutor from './PythonExecutor';

interface Execution extends Context {
    id: string;
    code: string;
    filename: string;
    clientId: string;
    executionId: number;
    packages: readonly string[];
    showPackageLogs: boolean;
}

export interface ExecutionResult {
    message: Message;
    reusable: boolean;
}

const pyodideReadyPromise = loadPyodide({ stdout: () => {}, stderr: () => {} });
const executorReadyPromise = pyodideReadyPromise.then((pyodide) => PythonExecutor.create(pyodide));
// The ready RPC reports bootstrap errors to the editor.
void executorReadyPromise.catch(() => {});

export class PyWorker {
    async ready() {
        return (await executorReadyPromise).supportsInterrupts;
    }

    async cancel(executionId: number) {
        (await executorReadyPromise).cancel(executionId);
    }

    async run(
        id: string,
        code: string,
        sendMessage: (message: Message) => void,
        filename = 'snippet.py',
        clientId = '',
        executionId = 0,
        packages: readonly string[] = [],
        showPackageLogs = false
    ): Promise<ExecutionResult> {
        const getTime = createTimestamp();
        try {
            const pyodide = await pyodideReadyPromise;
            const executor = await executorReadyPromise;
            executor.begin(executionId);
            try {
                const outcome = await this.execute(pyodide, executor, {
                    id,
                    code,
                    filename,
                    clientId,
                    executionId,
                    packages,
                    showPackageLogs,
                    sendMessage,
                    getTime
                });
                return {
                    message: { ...outcome, id, timeStamp: getTime() },
                    reusable: this.canReuse(pyodide)
                };
            } finally {
                executor.finish(executionId);
            }
        } catch (error: unknown) {
            return {
                message: {
                    type: 'error',
                    message: error instanceof Error ? error.message : String(error),
                    id,
                    timeStamp: getTime()
                },
                reusable: false
            };
        }
    }

    private async execute(
        pyodide: PyodideAPI,
        executor: PythonExecutor,
        execution: Execution
    ): Promise<{ type: 'log' | 'error'; message: string }> {
        const { id, code, filename, clientId, executionId } = execution;
        pyodide.registerComlink(Comlink);
        registerJsModule(pyodide, 'tdev', {
            sendMessage: (message: Message) => {
                execution.sendMessage(message);
            }
        });
        await this.preparePackages(pyodide, execution);
        const finishOutput = captureOutput(pyodide, id, execution);
        let restoreInput: (() => void) | undefined;
        let globals: PyProxy | undefined;
        let result: unknown;
        try {
            const fname = filename.endsWith('.py') ? filename : `${filename}.py`;
            const dict = pyodide.globals.get('dict');
            try {
                globals = dict(
                    Object.entries({
                        __name__: '__main__',
                        __file__: fname,
                        __package__: undefined
                    })
                ) as PyProxy;
            } finally {
                dict.destroy();
            }
            restoreInput = configureInput(pyodide, { id, clientId, executionId });
            try {
                result = await executor.execute(code, globals, fname);
            } catch (error: unknown) {
                if (error instanceof pyodide.ffi.PythonError) {
                    return { type: 'error', message: error.message };
                }
                throw error;
            }
            return { type: 'log', message: result === undefined ? '' : `${result}` };
        } finally {
            try {
                await finishOutput();
            } finally {
                try {
                    restoreInput?.();
                } finally {
                    globals?.destroy();
                    if (result instanceof pyodide.ffi.PyProxy) {
                        result.destroy();
                    }
                }
            }
        }
    }

    private async preparePackages(pyodide: PyodideAPI, execution: Execution) {
        const finishOutput = execution.showPackageLogs
            ? captureOutput(pyodide, execution.id, execution)
            : undefined;
        try {
            await loadPackages(pyodide, execution, execution.code, execution.packages);
        } finally {
            await finishOutput?.();
        }
    }

    private canReuse(pyodide: PyodideAPI): boolean {
        try {
            // Discard unfinished tasks instead of patching the Python scheduler.
            return (
                pyodide.runPython(
                    'not __import__("asyncio").all_tasks(loop=__import__("asyncio").get_event_loop())'
                ) === true
            );
        } catch {
            return false;
        }
    }
}

const createTimestamp = () => {
    let lastTime = Date.now();
    let fraction = 2;
    return () => {
        const now = Date.now();
        if (lastTime === now) {
            const timestamp = now + (1 - 1 / fraction);
            fraction += 1;
            return timestamp;
        }
        lastTime = now;
        fraction = 2;
        return now;
    };
};

Comlink.expose(PyWorker);
export type PyWorkerApi = typeof PyWorker;
