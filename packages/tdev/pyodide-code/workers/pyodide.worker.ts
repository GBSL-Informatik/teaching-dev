import registeredExtensions from '@tdev-pyodide/worker-extensions';
import * as Comlink from 'comlink';
import type { PyodideAPI } from 'pyodide';
import type { PyProxy } from 'pyodide/ffi';
import type { EventDeliveryResult, ExecutionEvent } from '../events';
import { createWorkerExtensions } from '../extensions/worker';
import { loadPyodide } from '../loadPyodide';
import type { Context, Message } from '../messages';
import WorkerEventSession from './WorkerEventSession';
import { finalizeExecution } from './finalizeExecution';
import { loadPackages } from './helper.loadPackages';
import { configureInput } from './input';
import { installWebio } from './installWebio';
import { captureOutput } from './output';
import { configureShell } from './shell';

interface Execution extends Context {
    id: string;
    code: string;
    filename: string;
    clientId: string;
    executionId: number;
    packages: readonly string[];
}

export interface ExecutionResult {
    message: Message;
    reusable: boolean;
}

const pyodideReadyPromise = loadPyodide({ stdout: () => {}, stderr: () => {} });
// The ready RPC reports bootstrap errors to the editor.
void pyodideReadyPromise.catch(() => {});

export class PyWorker {
    private eventSession?: WorkerEventSession;

    async ready() {
        await pyodideReadyPromise;
    }

    deliverEvent(event: ExecutionEvent): EventDeliveryResult {
        return this.eventSession?.deliver(event) ?? 'inactive';
    }

    async run(
        id: string,
        code: string,
        sendMessage: Context['sendMessage'],
        filename = 'snippet.py',
        clientId = '',
        executionId = 0,
        packages: readonly string[] = []
    ): Promise<ExecutionResult> {
        const getTime = createTimestamp();
        try {
            const pyodide = await pyodideReadyPromise;
            const message = await this.execute(pyodide, {
                id,
                code,
                filename,
                clientId,
                executionId,
                packages,
                sendMessage,
                getTime
            });
            return {
                message: { type: 'log', message, id, timeStamp: getTime() },
                reusable: this.canReuse(pyodide)
            };
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

    private async execute(pyodide: PyodideAPI, execution: Execution): Promise<string> {
        const { id, code, filename, clientId, executionId } = execution;
        pyodide.registerComlink(Comlink);
        const events = new WorkerEventSession(
            execution,
            registeredExtensions.map(({ name }) => name)
        );
        this.eventSession = events;
        const extensions = createWorkerExtensions(execution, registeredExtensions, (extension, targetId) =>
            events.source(extension, targetId)
        );
        let removeWebio: (() => void) | undefined;
        let output: ReturnType<typeof captureOutput> | undefined;
        let restoreInput: (() => void) | undefined;
        let restoreShell: (() => void) | undefined;
        let globals: PyProxy | undefined;
        let result: unknown;
        const errors: unknown[] = [];
        try {
            extensions.register(pyodide);
            removeWebio = installWebio(pyodide, events);
            await this.preparePackages(pyodide, execution);
            output = captureOutput(pyodide, id, execution);
            const fname = filename.endsWith('.py') ? filename : `${filename}.py`;
            const dict = pyodide.globals.get('dict');
            try {
                globals = dict(
                    Object.entries({
                        __name__: '__main__',
                        __file__: fname,
                        __package__: undefined
                    })
                );
            } finally {
                dict.destroy();
            }
            restoreInput = configureInput(pyodide, { id, clientId, executionId });
            restoreShell = configureShell(pyodide, output.clear);
            await execution.sendMessage({ type: 'execution-started', id, executionId });
            result = await pyodide.runPythonAsync(code, { globals, filename: fname });
            return result === undefined ? '' : `${result}`;
        } catch (error: unknown) {
            errors.push(error);
            throw error;
        } finally {
            await finalizeExecution(
                [
                    () => events.close(),
                    () => {
                        this.eventSession = undefined;
                    },
                    () => output?.finish(),
                    () => extensions.finish(),
                    () => restoreShell?.(),
                    () => restoreInput?.(),
                    () => removeWebio?.(),
                    () => globals?.destroy(),
                    () => {
                        if (result instanceof pyodide.ffi.PyProxy) {
                            result.destroy();
                        }
                    }
                ],
                errors
            );
        }
    }

    private async preparePackages(pyodide: PyodideAPI, execution: Execution) {
        const output = captureOutput(pyodide, execution.id, {
            getTime: execution.getTime,
            sendMessage: (message) => {
                if (message.type === 'error') {
                    console.error(message.message);
                } else if (message.type === 'log') {
                    console.log(message.message);
                }
            }
        });
        const errors: unknown[] = [];
        try {
            await loadPackages(pyodide, execution, execution.code, execution.packages);
        } catch (error: unknown) {
            errors.push(error);
            throw error;
        } finally {
            await finalizeExecution([() => output.finish()], errors);
        }
    }

    private canReuse(pyodide: PyodideAPI): boolean {
        try {
            // Keep runtimes with unfinished tasks out of the shared idle pool.
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
