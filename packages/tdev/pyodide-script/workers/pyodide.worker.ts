import * as Comlink from 'comlink';
import type { loadPyodide } from 'pyodide';
import { Message, PY_STDIN_ROUTE } from '../config';
// @ts-ignore
importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.js');
// @ts-ignore
let pyodideReadyPromise = (loadPyodide as typeof loadPyodide)({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/'
});

const pyModule = {
    getInput: (id: string, prompt: string) => {
        console.log('py input for', id, prompt);
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
import react_py
__prompt_str__ = ""
def get_input(prompt=""):
    global __prompt_str__
    __prompt_str__ = prompt
    s = react_py.getInput("${id}", prompt)
    return s
builtins.input = get_input
sys.stdin.readline = lambda: react_py.getInput("${id}", __prompt_str__)
`;

export class PyWorker {
    async run(id: string, code: string, onMessage: (message: Message) => void): Promise<Message> {
        const pyodide = await pyodideReadyPromise;
        const context = {};
        // Now load any packages we need, run the code, and send the result back.
        pyodide.registerComlink(Comlink);
        await pyodide.loadPackage('pyodide-http');
        await pyodide.loadPackagesFromImports(code);

        pyodide.registerJsModule('react_py', pyModule);

        const initCode = `
import sys
import pyodide_http

sys.tracebacklimit = 2
pyodide_http.patch_all()
`;
        await pyodide.runPythonAsync(initCode);
        // make a Python dictionary with the data from `context`
        const dict = pyodide.globals.get('dict');
        const globals = dict(Object.entries(context));
        pyodide.setStdout({
            batched: (s: string) => {
                onMessage({ type: 'log', message: s, id: id, timeStamp: Date.now() });
            }
        });
        await pyodide.runPythonAsync(patchInputCode(id));
        try {
            // Execute the python code in this context
            const result = await pyodide.runPythonAsync(code);
            return { type: 'log', message: JSON.stringify(result, null, 2), id: id, timeStamp: Date.now() };
        } catch (error: any) {
            return { type: 'error', message: error.message, id: id, timeStamp: Date.now() };
        } finally {
            pyodide.setStdout(undefined);
            pyodide.setInterruptBuffer(undefined as any);
        }
    }
}

Comlink.expose(PyWorker);
export type PyWorkerApi = typeof PyWorker; // For type inference in main thread
