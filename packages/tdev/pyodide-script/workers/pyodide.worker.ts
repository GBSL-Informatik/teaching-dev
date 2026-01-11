import * as Comlink from 'comlink';
// @ts-ignore
importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.js');
// @ts-ignore
let pyodideReadyPromise = loadPyodide({});

interface PyodideResult {
    type: 'success';
    result: number | string;
    id: string;
}
interface PyodideError {
    type: 'error';
    error: string;
    id: string;
}

type Result = PyodideResult | PyodideError;

export class PyWorker {
    async run(code: string): Promise<Result> {
        const pyodide = await pyodideReadyPromise;
        const context = {};
        const id = Math.random().toString(36).substring(7);
        // Now load any packages we need, run the code, and send the result back.
        await pyodide.loadPackagesFromImports(code);
        // make a Python dictionary with the data from `context`
        const dict = pyodide.globals.get('dict');
        const globals = dict(Object.entries(context));
        try {
            // Execute the python code in this context
            const result = await pyodide.runPythonAsync(code, { globals });
            return { type: 'success', result: JSON.stringify(result, null, 2), id };
        } catch (error: any) {
            return { type: 'error', error: error.message, id };
        }
    }
}

Comlink.expose(PyWorker);
export type PyWorkerApi = typeof PyWorker; // For type inference in main thread
