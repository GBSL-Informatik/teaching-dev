import * as Comlink from 'comlink';
import type { loadPyodide } from 'pyodide';
import { PY_STDIN_ROUTE } from '../config';
import { loadPackages } from './helper.loadPackages';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
// @ts-ignore
importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.js');
// @ts-ignore
let pyodideReadyPromise = (loadPyodide as typeof loadPyodide)({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/'
});

const pyModule = {
    getInput: (id: string, prompt: string) => {
        const request = new XMLHttpRequest();
        // Synchronous request to be intercepted by service worker
        request.open('GET', `${PY_STDIN_ROUTE}?id=${id}&prompt=${encodeURIComponent(prompt)}`, false);
        request.send(null);
        if (request.status !== 200) {
            throw new Error('User cancelled the input request');
        }
        return request.responseText;
    }
};
const patchInputCode = (id: string) => `
import sys, builtins
import browser_input
__prompt_str__ = ""
def get_input(prompt=""):
    global __prompt_str__
    __prompt_str__ = prompt
    s = browser_input.getInput("${id}", prompt)
    return s
builtins.input = get_input
sys.stdin.readline = lambda: browser_input.getInput("${id}", __prompt_str__)
`;

export class PyWorker {
    async run(
        id: string,
        code: string,
        sendMessage: (message: Message) => void,
        initCode: string = '',
        modules: Record<string, object> = {}
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
        for (const [name, module] of Object.entries(modules)) {
            pyodide.registerJsModule(name, module);
        }

        if (initCode) {
            await pyodide.runPythonAsync(initCode);
        }
        // make a Python dictionary with the data from `context`
        const dict = pyodide.globals.get('dict');
        const globals = dict(Object.entries(context));
        pyodide.setStdout({
            batched: (s: string) => {
                sendMessage({ type: 'log', message: s, id: id, timeStamp: getTime() });
            }
        });
        await pyodide.runPythonAsync(patchInputCode(id), { globals });
        try {
            // Execute the python code in this context
            const result = await pyodide.runPythonAsync(code);
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
