import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import { PY_STDIN_ROUTE } from '../config';
import { loadPyodide } from '../loadPyodide';
import { loadPackages } from './helper.loadPackages';

const pyodideReadyPromise = loadPyodide();

const pyModule = {
    getInput: (id: string, prompt: string, clientId: string, executionId: number) => {
        const request = new XMLHttpRequest();
        const query = new URLSearchParams({
            id,
            prompt: String(prompt),
            clientId,
            executionId: String(executionId),
            requestId: crypto.randomUUID()
        });
        // Synchronous request to be intercepted by service worker
        request.open('GET', `${PY_STDIN_ROUTE}?${query}`, false);
        request.send(null);
        if (request.status !== 200) {
            throw new Error('User cancelled the input request');
        }
        return request.responseText;
    }
};
const patchInputCode = (id: string, clientId: string, executionId: number) => `
import sys, builtins
import browser_input
__prompt_str__ = ""
def get_input(prompt=""):
    global __prompt_str__
    __prompt_str__ = prompt
    s = browser_input.getInput(${JSON.stringify(id)}, prompt, ${JSON.stringify(clientId)}, ${executionId})
    return s
builtins.input = get_input
sys.stdin.readline = lambda: get_input(__prompt_str__)
`;

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

        const context = {};
        pyodide.registerComlink(Comlink);

        await loadPackages(
            pyodide,
            {
                sendMessage,
                getTime
            },
            code
        );

        // patch input function to use browser_input module
        pyodide.registerJsModule('browser_input', pyModule);

        // TODO: move clock module to its own file/to the client
        pyodide.registerJsModule('tdev', {
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
        await pyodide.runPythonAsync(patchInputCode(id, clientId, executionId));
        const fname = filename.endsWith('.py') ? filename : `${filename}.py`;
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
            pyodide.setStdout(undefined);
        }
    }
}

Comlink.expose(PyWorker);
export type PyWorkerApi = typeof PyWorker; // For type inference in main thread
