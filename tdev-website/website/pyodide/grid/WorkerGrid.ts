import type { ExecutionEventSource } from '@tdev/pyodide-code/events';
import type { WorkerContext } from '@tdev/pyodide-code/extensions';
import type { PyBuffer, PyBufferView } from 'pyodide/ffi';
import {
    MAX_CANVAS_DIMENSION,
    MAX_GRID_CELLS,
    type GridCells,
    type GridFrame,
    type GridText
} from './protocol';

const TRANSPARENT = 'rgba(0,0,0,0)';
const DEFAULT_TEXT = { text: '', color: 'black', scale: 0.8 };

export default class WorkerGrid {
    readonly events: ExecutionEventSource;
    readonly rows: number;
    readonly cols: number;
    readonly scale: number;
    readonly grid_id: string;
    private readonly context: WorkerContext<GridFrame>;
    private cells: GridCells;
    private colors: string[];
    private colorIndices: Map<string, number>;
    private readonly labels = new Map<number, GridText>();
    private rendering = false;

    constructor(
        context: WorkerContext<GridFrame>,
        id: string,
        rows: number,
        cols: number,
        color = '',
        palette?: string[],
        scale = Math.max(1, Math.floor(500 / Math.max(rows, cols)))
    ) {
        this.validateDimensions(rows, cols, scale);
        this.context = context;
        this.grid_id = id;
        this.events = context.events.source(id);
        this.rows = rows;
        this.cols = cols;
        this.scale = scale;
        this.colors = this.validatePalette(palette ?? [color]);
        this.colorIndices = new Map(this.colors.map((value, index) => [value, index]));
        this.cells = this.createCells(this.colors.length);
        if (color !== '') {
            this.fill(color);
        }
    }

    get palette(): readonly string[] {
        return [...this.colors];
    }

    get_color(row: number, col: number): string {
        return this.colors[this.cells[this.index(row, col)]];
    }

    set_color(row: number, col: number, color: string) {
        const index = this.index(row, col);
        const value = this.colorIndex(color);
        this.cells[index] = value;
    }

    fill(color = '') {
        const index = this.colorIndex(color);
        this.cells.fill(index);
    }

    set_cells(values: PyBuffer, palette?: string[]) {
        const colors = palette === undefined ? this.colors : this.validatePalette(palette);
        const view = values.getBuffer();
        try {
            this.cells = this.readCells(view, colors.length);
            if (palette !== undefined) {
                this.colors = colors;
                this.colorIndices = new Map(colors.map((value, index) => [value, index]));
            }
        } finally {
            view.release();
        }
    }

    get_text(row: number, col: number) {
        return this.labels.get(this.index(row, col)) ?? DEFAULT_TEXT;
    }

    set_text(row: number, col: number, text: string) {
        this.updateText(row, col, { text });
    }

    set_text_color(row: number, col: number, color: string) {
        this.updateText(row, col, { color: this.validateColor(color) });
    }

    set_text_scale(row: number, col: number, scale: number) {
        if (!Number.isFinite(scale) || scale <= 0) {
            throw new Error('Cell text scale must be a positive finite number.');
        }
        this.updateText(row, col, { scale });
    }

    copy(id = this.grid_id): WorkerGrid {
        const grid = new WorkerGrid(this.context, id, this.rows, this.cols, '', this.colors, this.scale);
        grid.cells.set(this.cells);
        for (const [index, label] of this.labels) {
            grid.labels.set(index, { ...label });
        }
        return grid;
    }

    async render() {
        if (this.rendering) {
            throw new Error('Await grid.render() before rendering another frame.');
        }
        this.rendering = true;
        try {
            await this.context.sendAndWait(this.grid_id, {
                rows: this.rows,
                cols: this.cols,
                scale: this.scale,
                cells: this.cells.slice(),
                palette: [...this.colors],
                text: [...this.labels.values()]
                    .filter(({ text }) => text !== '')
                    .map((label) => ({ ...label }))
            });
        } finally {
            this.rendering = false;
        }
    }

    private validateDimensions(rows: number, cols: number, scale: number) {
        if (!Number.isSafeInteger(rows) || rows < 1 || !Number.isSafeInteger(cols) || cols < 1) {
            throw new Error('Grid rows and columns must be positive integers.');
        }
        if (rows * cols > MAX_GRID_CELLS) {
            throw new Error(`A grid may contain at most ${MAX_GRID_CELLS} cells.`);
        }
        if (!Number.isSafeInteger(scale) || scale < 1) {
            throw new Error('Grid scale must be a positive integer.');
        }
        if (rows * scale > MAX_CANVAS_DIMENSION || cols * scale > MAX_CANVAS_DIMENSION) {
            throw new Error(`A grid canvas may be at most ${MAX_CANVAS_DIMENSION} pixels wide or high.`);
        }
        if (rows * cols * scale * scale > MAX_GRID_CELLS) {
            throw new Error(`A grid canvas may contain at most ${MAX_GRID_CELLS} pixels.`);
        }
    }

    private readCells(view: PyBufferView, paletteSize: number): GridCells {
        if (view.ndim !== 2 || view.shape[0] !== this.rows || view.shape[1] !== this.cols) {
            throw new Error(`Cell data must have shape (${this.rows}, ${this.cols}).`);
        }
        if (!view.c_contiguous) {
            throw new Error('Cell data must be contiguous. Use numpy.ascontiguousarray(data).');
        }
        const data = view.data;
        if (!(
            data instanceof Uint8Array ||
            data instanceof Int8Array ||
            data instanceof Uint16Array ||
            data instanceof Int16Array ||
            data instanceof Uint32Array ||
            data instanceof Int32Array
        )) {
            throw new Error('Cell data must use 8-, 16-, or 32-bit integers.');
        }
        const cells = this.createCells(paletteSize);
        for (let index = 0; index < cells.length; index++) {
            const value = data[view.offset + index];
            if (value < 0 || value >= paletteSize) {
                throw new Error(`Cell palette index ${value} is out of range.`);
            }
            cells[index] = value;
        }
        return cells;
    }

    private index(row: number, col: number): number {
        if (
            !Number.isSafeInteger(row) ||
            row < 0 ||
            row >= this.rows ||
            !Number.isSafeInteger(col) ||
            col < 0 ||
            col >= this.cols
        ) {
            throw new Error('Grid cell coordinates are out of range.');
        }
        return row * this.cols + col;
    }

    private validateColor(color: string): string {
        if (typeof color !== 'string') {
            throw new Error('Cell colors must be CSS color strings.');
        }
        return color === '' ? TRANSPARENT : color;
    }

    private validatePalette(palette: string[]): string[] {
        if (!Array.isArray(palette) || palette.length === 0) {
            throw new Error('A grid palette must contain at least one CSS color.');
        }
        return palette.map((color) => this.validateColor(color));
    }

    private colorIndex(color: string): number {
        const value = this.validateColor(color);
        const existing = this.colorIndices.get(value);
        if (existing !== undefined) {
            return existing;
        }
        const index = this.colors.length;
        this.colors.push(value);
        this.colorIndices.set(value, index);
        if (
            (index === 256 && this.cells.BYTES_PER_ELEMENT === 1) ||
            (index === 65536 && this.cells.BYTES_PER_ELEMENT === 2)
        ) {
            const cells = this.createCells(this.colors.length);
            cells.set(this.cells);
            this.cells = cells;
        }
        return index;
    }

    private createCells(paletteSize: number): GridCells {
        const size = this.rows * this.cols;
        if (paletteSize <= 256) {
            return new Uint8Array(size);
        }
        if (paletteSize <= 65536) {
            return new Uint16Array(size);
        }
        return new Uint32Array(size);
    }

    private updateText(
        row: number,
        col: number,
        values: Partial<Pick<GridText, 'text' | 'color' | 'scale'>>
    ) {
        const index = this.index(row, col);
        this.labels.set(index, { ...DEFAULT_TEXT, ...this.labels.get(index), row, col, ...values });
    }
}
