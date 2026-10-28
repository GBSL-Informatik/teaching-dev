import type { PyodideAPI } from 'pyodide';
import type { Context } from '../messages';
import { createMessageDelivery } from './messageDelivery';

export const captureOutput = (pyodide: PyodideAPI, id: string, context: Context) => {
    const delivery = createMessageDelivery((message) => context.sendMessage(message));
    const stdout = createOutputWriter((message) =>
        delivery.send({ type: 'log', message, id, timeStamp: context.getTime() })
    );
    const stderr = createOutputWriter((message) =>
        delivery.send({ type: 'error', message, id, timeStamp: context.getTime() })
    );
    pyodide.setStdout(stdout);
    pyodide.setStderr(stderr);

    const finish = async () => {
        try {
            pyodide.runPython('__import__("sys").stdout.flush(); __import__("sys").stderr.flush()');
        } finally {
            stdout.flush();
            stderr.flush();
            pyodide.setStdout(undefined);
            pyodide.setStderr(undefined);
        }
        await delivery.finish();
    };

    return {
        finish,
        clear() {
            stdout.flush();
            stderr.flush();
            delivery.send({ type: 'clear', id, timeStamp: context.getTime() });
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
