import * as Comlink from 'comlink';

export class SquareWorker {
    async square(n: number): Promise<number> {
        // wait 1 second to simulate a long computation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const result = n * n;
        return result;
    }
}

Comlink.expose(SquareWorker);
export type WorkerApi = typeof SquareWorker; // For type inference in main thread
