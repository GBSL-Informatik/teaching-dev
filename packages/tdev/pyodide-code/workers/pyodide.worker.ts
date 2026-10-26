import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import { loadPyodide } from '../loadPyodide';
import { loadPackages } from './helper.loadPackages';
import { registerJsModule } from './registerJsModule';
import { configureInput } from './input';

const pyodideReadyPromise = loadPyodide();

export class PyWorker {
    async run(
        id: string,
        code: string,
        sendMessage: (message: Message) => void,
        filename = 'snippet.py',
        clientId = '',
        executionId = 0
    ): Promise<Message> {
        const pyodide = await pyodideReadyPromise;
        // Ensure unique timestamps for messages
        let last_ts = Date.now();
        let ts_fraction = 2;
        const getTime = () => {
            const now = Date.now();
            let t = now;
            if (last_ts === t) {
                t = t + (1 - 1 / ts_fraction);
                ts_fraction += 1;
            } else {
                last_ts = now;
                ts_fraction = 2;
            }
            return t;
        };

        const fname = filename.endsWith('.py') ? filename : `${filename}.py`;
        const context = {
            __name__: '__main__',
            __file__: fname,
            __package__: undefined
        };
        pyodide.registerComlink(Comlink);

        await loadPackages(
            pyodide,
            {
                sendMessage,
                getTime
            },
            code
        );

        registerJsModule(pyodide, 'tdev', {
            sendMessage: (message: Message) => {
                sendMessage(message);
            }
        });

        // make a Python dictionary with the data from `context`
        const dict = pyodide.globals.get('dict');
        const globals = dict(Object.entries(context));
        pyodide.setStdout({
            batched: (s: string) => {
                sendMessage({ type: 'log', message: s, id: id, timeStamp: getTime() });
            }
        });
        const restoreInput = configureInput(pyodide, { id, clientId, executionId });
        try {
            // Execute the python code in this context
            const result = await pyodide.runPythonAsync(code, { globals, filename: fname });
            return {
                type: 'log',
                message: result === undefined ? '' : `${result}`,
                id: id,
                timeStamp: getTime()
            };
        } catch (error: any) {
            return { type: 'error', message: error.message, id: id, timeStamp: getTime() };
        } finally {
            restoreInput();
            pyodide.setStdout(undefined);
        }
    }
}

Comlink.expose(PyWorker);
export type PyWorkerApi = typeof PyWorker; // For type inference in main thread
