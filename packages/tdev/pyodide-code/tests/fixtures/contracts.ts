import { defineClientExtension, defineWorkerExtension } from '../../extensions';

declare const workerRegistry: typeof import('@tdev-pyodide/worker-extensions').default;
declare const clientRegistry: typeof import('@tdev-pyodide/client-extensions').default;

// @ts-expect-error Worker registries expose factories, not browser handlers.
workerRegistry[0].extension.handleMessage;
// @ts-expect-error Browser registries expose handlers, not worker factories.
clientRegistry[0].extension.createModules;

// @ts-expect-error Async handlers would leave the surrounding MobX action.
defineClientExtension<number>(async () => {});

defineWorkerExtension<number>((context) => {
    // @ts-expect-error The worker must send the shared payload type.
    context.send('target', 'wrong payload');
    return {};
});
