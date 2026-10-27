import type { PyodideAPI } from 'pyodide';
import { PY_STDIN_ROUTE } from '../config';
import { registerJsModule } from './registerJsModule';

interface InputContext {
    id: string;
    clientId: string;
    executionId: number;
}

const INPUT_WRAPPER = `
import builtins, browser_input
def get_input(prompt="", /):
    prompt = str(prompt)
    browser_input.setPrompt(prompt)
    try:
        value = browser_input.originalInput(prompt)
        print(value)
        return value
    finally:
        browser_input.setPrompt("")
builtins.input = get_input
`;

export const configureInput = (pyodide: PyodideAPI, context: InputContext) => {
    const builtins = pyodide.pyimport('builtins');
    const sys = pyodide.pyimport('sys');
    const originalInput = pyodide.runPython('__import__("builtins").input');
    const originalStdin = pyodide.runPython('__import__("sys").stdin');
    const inputStream = pyodide.runPython('open(0, "r", encoding="utf-8", closefd=False)');
    let prompt = '';

    const restoreInput = () => {
        builtins.input = originalInput;
        sys.stdin = originalStdin;
        inputStream.close();
        pyodide.setStdin({});
        inputStream.destroy();
        originalStdin.destroy();
        originalInput.destroy();
        sys.destroy();
        builtins.destroy();
    };
    try {
        registerJsModule(pyodide, 'browser_input', {
            originalInput,
            setPrompt: (value: string) => {
                prompt = value;
            }
        });
        pyodide.setStdin({ read: createInputReader(pyodide, context, () => prompt) });
        sys.stdin = inputStream;
        pyodide.runPython(INPUT_WRAPPER);
        return restoreInput;
    } catch (error) {
        restoreInput();
        throw error;
    }
};

const createInputReader = (pyodide: PyodideAPI, context: InputContext, getPrompt: () => string) => {
    const encoder = new TextEncoder();
    let pending = new Uint8Array();
    let offset = 0;
    let reachedEOF = false;

    return (buffer: Uint8Array): number => {
        if (reachedEOF || buffer.length === 0) {
            return 0;
        }
        try {
            if (offset === pending.length) {
                const value = requestInput(context, getPrompt());
                if (value === null) {
                    reachedEOF = true;
                    return 0;
                }
                pending = encoder.encode(`${value}\n`);
                offset = 0;
            }
            const count = Math.min(buffer.length, pending.length - offset);
            buffer.set(pending.subarray(offset, offset + count));
            offset += count;
            return count;
        } catch {
            throw new pyodide.FS.ErrnoError(pyodide.ERRNO_CODES.EIO);
        }
    };
};

const requestInput = (context: InputContext, prompt: string): string | null => {
    const query = new URLSearchParams({
        id: context.id,
        clientId: context.clientId,
        executionId: String(context.executionId),
        prompt,
        requestId: crypto.randomUUID()
    });
    while (true) {
        const request = new XMLHttpRequest();
        // Renew bounded waits without changing the logical input request.
        request.open('GET', `${PY_STDIN_ROUTE}?${query}`, false);
        request.send(null);
        if (request.status === 204) {
            continue;
        }
        if (request.status === 410) {
            return null;
        }
        if (request.status !== 200) {
            throw new Error(`Python input request failed: HTTP ${request.status}`);
        }
        return request.responseText;
    }
};
