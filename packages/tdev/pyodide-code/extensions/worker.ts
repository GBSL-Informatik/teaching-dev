import type { PyodideAPI } from 'pyodide';
import type { Context } from '../messages';
import type { RegisteredExtension, WorkerExtension } from './index';
import { registerJsModule } from '../workers/registerJsModule';
import { createMessageDelivery } from '../workers/messageDelivery';
import type { ExecutionEventSource } from '../events';

export const createWorkerExtensions = (
    context: Context & { id: string },
    extensions: readonly RegisteredExtension<WorkerExtension>[],
    createEventSource: (extension: string, targetId: string) => ExecutionEventSource
) => {
    const delivery = createMessageDelivery((message) => context.sendMessage(message));
    let isActive = true;

    const register = (pyodide: PyodideAPI) => {
        const moduleNames = new Set(['browser_input', 'webio']);
        for (const { name, extension } of extensions) {
            const modules = extension.createModules({
                editorId: context.id,
                events: { source: (targetId) => createEventSource(name, targetId) },
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
