import type { Context, Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import type { PyodideAPI } from 'pyodide';
import type { PyProxy } from 'pyodide/ffi';
import { loadPyodide } from '../loadPyodide';
import { loadPackages } from './helper.loadPackages';
import { configureInput } from './input';
import { captureOutput } from './output';
import { registerJsModule } from './registerJsModule';

interface Execution extends Context {
    id: string;
    code: string;
    filename: string;
    clientId: string;
    executionId: number;
    packages: readonly string[];
    showPackageLogs: boolean;
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
        packages: readonly string[] = [],
        showPackageLogs = false
    ): Promise<Message> {
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
                showPackageLogs,
                sendMessage,
                getTime
            });
            return { type: 'log', message, id, timeStamp: getTime() };
        } catch (error: unknown) {
            return {
                type: 'error',
                message: error instanceof Error ? error.message : String(error),
                id,
                timeStamp: getTime()
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
                );
            } finally {
                dict.destroy();
            }
            restoreInput = configureInput(pyodide, { id, clientId, executionId });
            result = await pyodide.runPythonAsync(code, { globals, filename: fname });
            return result === undefined ? '' : `${result}`;
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
