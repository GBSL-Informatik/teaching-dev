import type { Context, Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import type { PyodideAPI } from 'pyodide';
import type { PyProxy } from 'pyodide/ffi';
import { loadPyodide } from '../loadPyodide';
import { loadPackages } from './helper.loadPackages';
import { configureInput } from './input';
import { captureOutput } from './output';
import { registerJsModule } from './registerJsModule';
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
    async ready() {
        await pyodideReadyPromise;
    }

    async run(
        id: string,
        code: string,
        sendMessage: (message: Message) => void,
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
        registerJsModule(pyodide, 'tdev', {
            sendMessage: (message: Message) => {
                execution.sendMessage(message);
            }
        });
        await this.preparePackages(pyodide, execution);
        const output = captureOutput(pyodide, id, execution);
        let restoreInput: (() => void) | undefined;
        let restoreShell: (() => void) | undefined;
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
                );
            } finally {
                dict.destroy();
            }
            restoreInput = configureInput(pyodide, { id, clientId, executionId });
            restoreShell = configureShell(pyodide, output.clear);
            result = await pyodide.runPythonAsync(code, { globals, filename: fname });
            return result === undefined ? '' : `${result}`;
        } finally {
            try {
                await output.finish();
            } finally {
                try {
                    restoreShell?.();
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
        try {
            await loadPackages(pyodide, execution, execution.code, execution.packages);
        } finally {
            await output.finish();
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
