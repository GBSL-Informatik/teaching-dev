import type { PyodideAPI } from 'pyodide';
import type { Context } from '../pyodideJsModules';

export const captureOutput = (pyodide: PyodideAPI, id: string, context: Context) => {
    const pending = new Set<Promise<void>>();
    let deliveryError: unknown;
    const send = (type: 'log' | 'error', message: string) => {
        const delivery = Promise.resolve(
            context.sendMessage({ type, message, id, timeStamp: context.getTime() })
        );
        pending.add(delivery);
        delivery.then(
            () => pending.delete(delivery),
            (error: unknown) => {
                deliveryError = error;
                pending.delete(delivery);
            }
        );
    };
    const stdout = createOutputWriter((message) => send('log', message));
    const stderr = createOutputWriter((message) => send('error', message));
    pyodide.setStdout(stdout);
    pyodide.setStderr(stderr);

    return async () => {
        try {
            pyodide.runPython('__import__("sys").stdout.flush(); __import__("sys").stderr.flush()');
        } finally {
            stdout.flush();
            stderr.flush();
            pyodide.setStdout(undefined);
            pyodide.setStderr(undefined);
        }
        await Promise.all([...pending]);
        if (deliveryError !== undefined) {
            throw deliveryError;
        }
    };
};

const createOutputWriter = (send: (message: string) => void) => {
    const decoder = new TextDecoder();
    let partial = '';
    const append = (text: string) => {
        const lines = `${partial}${text}`.split('\n');
        partial = lines.pop() || '';
        for (const line of lines) {
            send(line);
        }
    };
    const flushPartial = () => {
        if (partial) {
            send(partial);
            partial = '';
        }
    };
    return {
        write(buffer: Uint8Array) {
            append(decoder.decode(buffer, { stream: true }));
            return buffer.length;
        },
        fsync: flushPartial,
        flush() {
            append(decoder.decode());
            flushPartial();
        }
    };
};
