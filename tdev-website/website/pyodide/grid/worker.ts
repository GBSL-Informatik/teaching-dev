import source from '!!raw-loader!./src/python/grid.py';
import { defineWorkerExtension } from '@tdev/pyodide-code/extensions';
import type { GridFrame } from './protocol';
import WorkerGrid from './src/worker/WorkerGrid';

export default defineWorkerExtension<GridFrame>(
    (context) => ({
        _grid_bridge: {
            create_grid: (
                id: string,
                rows: number,
                cols: number,
                color: string,
                palette?: string[],
                scale?: number
            ) => new WorkerGrid(context, id, rows, cols, color, palette, scale)
        }
    }),
    { grid: source }
);
