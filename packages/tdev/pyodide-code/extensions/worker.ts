import type { PyodideAPI } from 'pyodide';
import type { ExecutionEventSource } from '../events';
import type { Context } from '../messages';
import { createMessageDelivery } from '../workers/messageDelivery';
import { registerJsModule } from '../workers/registerJsModule';
import { registerPythonModule } from '../workers/registerPythonModule';
import type { RegisteredExtension, WorkerExtension } from './index';

export const createWorkerExtensions = (
    context: Context & { id: string },
    extensions: readonly RegisteredExtension<WorkerExtension>[],
    createEventSource: (extension: string, targetId: string) => ExecutionEventSource
) => {
    const delivery = createMessageDelivery((message) => context.sendMessage(message));
    let isActive = true;

    const register = (pyodide: PyodideAPI) => {
        const moduleNames = new Set(['browser_input', 'webio']);
        const pythonModules: [string, string][] = [];
        for (const { name, extension } of extensions) {
            const send = (targetId: string, payload: unknown) =>
                delivery.send({
                    type: 'extension',
                    extension: name,
                    id: context.id,
                    targetId,
                    timeStamp: context.getTime(),
                    payload
                });
            const modules = extension.createModules({
                editorId: context.id,
                events: { source: (targetId) => createEventSource(name, targetId) },
                send: (targetId, payload) => {
                    if (!isActive) {
                        return;
                    }
                    void send(targetId, payload);
                },
                sendAndWait: (targetId, payload) => {
                    if (!isActive) {
                        return Promise.reject(new Error('This Python extension execution has ended.'));
                    }
                    return send(targetId, payload);
                }
            });
            for (const [moduleName, module] of Object.entries(modules)) {
                if (moduleNames.has(moduleName)) {
                    throw new Error(`Duplicate or reserved Pyodide module: ${moduleName}`);
                }
                moduleNames.add(moduleName);
                registerJsModule(pyodide, moduleName, module);
            }
            for (const [moduleName, source] of Object.entries(extension.pythonModules ?? {})) {
                if (moduleNames.has(moduleName)) {
                    throw new Error(`Duplicate or reserved Pyodide module: ${moduleName}`);
                }
                moduleNames.add(moduleName);
                pythonModules.push([moduleName, source]);
            }
        }
        for (const [name, source] of pythonModules) {
            registerPythonModule(pyodide, name, source);
        }
    };

    const finish = async () => {
        isActive = false;
        await delivery.finish();
    };

    return { register, finish };
};
