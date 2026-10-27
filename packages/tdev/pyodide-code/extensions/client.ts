import extensions from '@tdev-pyodide/client-extensions';
import type { ClientContext, ExtensionMessage } from './index';

export const handleExtensionMessage = (context: ClientContext, message: ExtensionMessage) => {
    const registration = extensions.find(({ name }) => name === message.extension);
    if (!registration) {
        throw new Error(`Unknown Pyodide extension: ${message.extension}`);
    }
    registration.extension.handleMessage(context, {
        editorId: message.id,
        targetId: message.targetId,
        timeStamp: message.timeStamp,
        payload: message.payload
    });
};
