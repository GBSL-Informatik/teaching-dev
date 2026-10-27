import type { PyodideAPI } from 'pyodide';
import type { Context } from '../pyodideJsModules';
import type { RegisteredExtension, WorkerExtension } from './index';
import { registerJsModule } from '../workers/registerJsModule';

export const createWorkerExtensions = (
    context: Context & { id: string },
    extensions: readonly RegisteredExtension<WorkerExtension>[],
    legacyModuleNames: readonly string[] = []
) => {
    const pending = new Set<Promise<void>>();
    let deliveryError: unknown;
    let deliveryFailed = false;
    let isActive = true;

    const register = (pyodide: PyodideAPI) => {
        const moduleNames = new Set(['tdev', 'browser_input', ...legacyModuleNames]);
        for (const { name, extension } of extensions) {
            const modules = extension.createModules({
                editorId: context.id,
                send: (targetId, payload) => {
                    if (!isActive) {
                        return;
                    }
                    const delivery = Promise.resolve(
                        context.sendMessage({
                            type: 'extension',
                            extension: name,
                            id: context.id,
                            targetId,
                            timeStamp: context.getTime(),
                            payload
                        })
                    );
                    pending.add(delivery);
                    delivery.then(
                        () => pending.delete(delivery),
                        (error: unknown) => {
                            deliveryFailed = true;
                            deliveryError = error;
                            pending.delete(delivery);
                        }
                    );
                }
            });
            for (const [moduleName, module] of Object.entries(modules)) {
                if (moduleNames.has(moduleName)) {
                    throw new Error(`Duplicate or reserved Pyodide module: ${moduleName}`);
                }
                moduleNames.add(moduleName);
                registerJsModule(pyodide, moduleName, module);
            }
        }
    };

    const finish = async () => {
        isActive = false;
        await Promise.allSettled([...pending]);
        if (deliveryFailed) {
            throw deliveryError;
        }
    };

    return { register, finish };
};
