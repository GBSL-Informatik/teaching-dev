import type { PyodideAPI } from 'pyodide';
import { describe, expect, it, vi } from 'vitest';
import { defineWorkerExtension, type WorkerContext } from '../extensions';
import { createWorkerExtensions as createExtensions } from '../extensions/worker';
import { registerJsModule } from '../workers/registerJsModule';
import { registerPythonModule } from '../workers/registerPythonModule';

vi.mock('../workers/registerJsModule', () => ({ registerJsModule: vi.fn() }));
vi.mock('../workers/registerPythonModule', () => ({ registerPythonModule: vi.fn() }));

const pyodide = {} as PyodideAPI;
const createWorkerExtensions = (
    context: Parameters<typeof createExtensions>[0],
    extensions: Parameters<typeof createExtensions>[1]
) =>
    createExtensions(context, extensions, (extension, targetId) => ({ extension, targetId, executionId: 1 }));

describe('Pyodide worker extensions', () => {
    it('registers Python sources after the JavaScript bridges', async () => {
        const extension = defineWorkerExtension(() => ({ _bridge: {} }), { example: 'value = 42' });
        const session = createWorkerExtensions({ id: 'editor', getTime: Date.now, sendMessage: vi.fn() }, [
            { name: 'example', extension }
        ]);
        session.register(pyodide);
        expect(registerJsModule).toHaveBeenLastCalledWith(pyodide, '_bridge', {});
        expect(registerPythonModule).toHaveBeenLastCalledWith(pyodide, 'example', 'value = 42');
        expect(vi.mocked(registerJsModule).mock.invocationCallOrder.at(-1)).toBeLessThan(
            vi.mocked(registerPythonModule).mock.invocationCallOrder.at(-1)!
        );
        await session.finish();
    });

    it.each(['browser_input', 'webio', 'duplicate'])(
        'rejects reserved or duplicate Python source names: %s',
        async (name) => {
            const extension = defineWorkerExtension(() => ({ duplicate: {} }), { [name]: '' });
            const session = createWorkerExtensions(
                { id: 'editor', getTime: Date.now, sendMessage: vi.fn() },
                [{ name: 'example', extension }]
            );
            expect(() => session.register(pyodide)).toThrow(`Duplicate or reserved Pyodide module: ${name}`);
            await session.finish();
        }
    );

    it('acknowledges awaited deliveries and rejects use after execution finishes', async () => {
        let context!: WorkerContext<number>;
        let acknowledge!: () => void;
        const delivery = new Promise<void>((resolve) => {
            acknowledge = resolve;
        });
        const session = createWorkerExtensions(
            { id: 'editor', getTime: Date.now, sendMessage: () => delivery },
            [
                {
                    name: 'example',
                    extension: defineWorkerExtension<number>((ctx) => {
                        context = ctx;
                        return {};
                    })
                }
            ]
        );
        session.register(pyodide);
        let delivered = false;
        const frame = context.sendAndWait('grid', 42).then(() => {
            delivered = true;
        });
        await Promise.resolve();
        expect(delivered).toBe(false);
        acknowledge();
        await frame;
        expect(delivered).toBe(true);
        await session.finish();
        await expect(context.sendAndWait('grid', 43)).rejects.toThrow('execution has ended');
    });

    it('propagates an awaited delivery failure without losing finalization diagnostics', async () => {
        let context!: WorkerContext<number>;
        const failure = new Error('renderer failed');
        const session = createWorkerExtensions(
            { id: 'editor', getTime: Date.now, sendMessage: () => Promise.reject(failure) },
            [
                {
                    name: 'example',
                    extension: defineWorkerExtension<number>((ctx) => {
                        context = ctx;
                        return {};
                    })
                }
            ]
        );
        session.register(pyodide);
        await expect(context.sendAndWait('grid', 42)).rejects.toBe(failure);
        await expect(session.finish()).rejects.toBe(failure);
    });

    it('adds transport metadata without confusing editor and target IDs', async () => {
        const sendMessage = vi.fn();
        const extension = defineWorkerExtension<number>((context) => ({
            clock: { update: () => context.send('target-clock', 42) }
        }));
        const session = createWorkerExtensions({ id: 'source-editor', getTime: () => 123, sendMessage }, [
            { name: 'example', extension }
        ]);
        session.register(pyodide);
        const module = vi.mocked(registerJsModule).mock.lastCall?.[2] as { update: () => void };
        module.update();
        await session.finish();
        expect(sendMessage).toHaveBeenCalledWith({
            type: 'extension',
            extension: 'example',
            id: 'source-editor',
            targetId: 'target-clock',
            timeStamp: 123,
            payload: 42
        });
    });

    it('creates fresh module objects and context for each execution', async () => {
        const createModules = vi.fn((context: WorkerContext<number>) => ({
            counter: { editor: context.editorId, value: 0 }
        }));
        const extensions = [{ name: 'example', extension: defineWorkerExtension(createModules) }];
        const modules: object[] = [];
        for (const id of ['first', 'second']) {
            const session = createWorkerExtensions(
                { id, getTime: Date.now, sendMessage: vi.fn() },
                extensions
            );
            session.register(pyodide);
            modules.push(vi.mocked(registerJsModule).mock.lastCall![2]);
            await session.finish();
        }
        expect(createModules).toHaveBeenCalledTimes(2);
        expect(modules).toEqual([
            { editor: 'first', value: 0 },
            { editor: 'second', value: 0 }
        ]);
        expect(modules[0]).not.toBe(modules[1]);
    });

    it.each(['browser_input', 'webio'])('rejects the reserved %s module', async (name) => {
        const session = createWorkerExtensions({ id: 'editor', getTime: Date.now, sendMessage: vi.fn() }, [
            { name: 'example', extension: defineWorkerExtension(() => ({ [name]: {} })) }
        ]);
        expect(() => session.register(pyodide)).toThrow(`Duplicate or reserved Pyodide module: ${name}`);
        await session.finish();
    });

    it('drains messages and closes contexts after a later factory fails', async () => {
        let context: WorkerContext<number>;
        let completeDelivery!: () => void;
        const delivery = new Promise<void>((resolve) => {
            completeDelivery = resolve;
        });
        const sendMessage = vi.fn(() => delivery);
        const session = createWorkerExtensions({ id: 'editor', getTime: Date.now, sendMessage }, [
            {
                name: 'first',
                extension: defineWorkerExtension<number>((ctx) => {
                    context = ctx;
                    ctx.send('clock', 1);
                    return { clock: {} };
                })
            },
            {
                name: 'second',
                extension: defineWorkerExtension(() => {
                    throw new Error('factory failed');
                })
            }
        ]);
        expect(() => session.register(pyodide)).toThrow('factory failed');
        let finished = false;
        const finish = session.finish().then(() => {
            finished = true;
        });
        await Promise.resolve();
        expect(finished).toBe(false);
        context!.send('clock', 2);
        expect(sendMessage).toHaveBeenCalledTimes(1);
        completeDelivery();
        await finish;
        expect(finished).toBe(true);
    });

    it('waits for all deliveries before reporting a rejected handler', async () => {
        let completeDelivery!: () => void;
        const delayed = new Promise<void>((resolve) => {
            completeDelivery = resolve;
        });
        const failure = new Error('handler failed');
        const sendMessage = vi.fn().mockRejectedValueOnce(failure).mockReturnValueOnce(delayed);
        const session = createWorkerExtensions({ id: 'editor', getTime: Date.now, sendMessage }, [
            {
                name: 'example',
                extension: defineWorkerExtension<number>((ctx) => {
                    ctx.send('clock', 1);
                    ctx.send('clock', 2);
                    return {};
                })
            }
        ]);
        session.register(pyodide);
        let finished = false;
        const finish = session.finish();
        const rejection = expect(finish).rejects.toBe(failure);
        void finish.then(
            () => {
                finished = true;
            },
            () => {
                finished = true;
            }
        );
        await Promise.resolve();
        expect(finished).toBe(false);
        completeDelivery();
        await rejection;
        expect(finished).toBe(true);
    });
});
