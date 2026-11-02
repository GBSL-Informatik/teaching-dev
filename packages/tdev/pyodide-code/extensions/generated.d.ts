declare module '@tdev-pyodide/worker-extensions' {
    const extensions: import('./index').RegisteredExtension<import('./index').WorkerExtension>[];
    export default extensions;
}

declare module '@tdev-pyodide/client-extensions' {
    const extensions: import('./index').RegisteredExtension<import('./index').ClientExtension>[];
    export default extensions;
}
