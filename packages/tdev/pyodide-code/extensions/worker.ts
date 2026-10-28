import type { PyodideAPI } from 'pyodide';
import type { Context } from '../messages';
import type { RegisteredExtension, WorkerExtension } from './index';
import { registerJsModule } from '../workers/registerJsModule';
import { createMessageDelivery } from '../workers/messageDelivery';

export const createWorkerExtensions = (
    context: Context & { id: string },
    extensions: readonly RegisteredExtension<WorkerExtension>[]
) => {
    const delivery = createMessageDelivery((message) => context.sendMessage(message));
    let isActive = true;

    const register = (pyodide: PyodideAPI) => {
        const moduleNames = new Set(['browser_input']);
        for (const { name, extension } of extensions) {
            const modules = extension.createModules({
                editorId: context.id,
                send: (targetId, payload) => {
                    if (!isActive) {
                        return;
                    }
                    delivery.send({
                        type: 'extension',
                        extension: name,
                        id: context.id,
                        targetId,
                        timeStamp: context.getTime(),
                        payload
                    });
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
        await delivery.finish();
    };

    return { register, finish };
};
