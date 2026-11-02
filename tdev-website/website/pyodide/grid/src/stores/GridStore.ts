import type { ClientContext } from '@tdev/pyodide-code/extensions';
import { action, observable } from 'mobx';
import Grid from '../models/Grid';

export default class GridStore {
    readonly context: ClientContext;
    readonly grids = observable.map<string, Grid>([], { deep: false });

    constructor(context: ClientContext) {
        this.context = context;
    }

    @action
    useGrid(id: string): Grid {
        const existingGrid = this.grids.get(id);
        if (existingGrid) {
            return existingGrid;
        }
        const grid = new Grid(id, this);
        this.grids.set(id, grid);
        return grid;
    }
}
