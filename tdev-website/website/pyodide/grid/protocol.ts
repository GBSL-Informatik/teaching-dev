export interface GridText {
    row: number;
    col: number;
    text: string;
    color: string;
    scale: number;
}

export interface GridFrame {
    rows: number;
    cols: number;
    scale: number;
    cells: GridCells;
    palette: readonly string[];
    text: readonly GridText[];
}

export type GridCells = Uint8Array | Uint16Array | Uint32Array;

export const MAX_GRID_CELLS = 16_777_216;
export const MAX_CANVAS_DIMENSION = 8192;
