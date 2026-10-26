export class ModuleWorker {
    readonly worker: Worker;

    constructor(url: URL) {
        // Bundlers otherwise replace the worker type with the site's classic script format.
        this.worker = new Worker(url, { type: 'module' });
    }
}
