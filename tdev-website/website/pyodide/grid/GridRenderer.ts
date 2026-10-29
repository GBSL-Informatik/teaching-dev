import type { GridFrame } from './protocol';

export default class GridRenderer {
    readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly pixelCanvas: HTMLCanvasElement;
    private readonly pixelContext: CanvasRenderingContext2D;
    private readonly colorContext: CanvasRenderingContext2D;
    private colors = new Map<string, number>();
    private image?: ImageData;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = this.getContext(canvas);
        this.pixelCanvas = document.createElement('canvas');
        this.pixelContext = this.getContext(this.pixelCanvas);
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = 1;
        colorCanvas.height = 1;
        this.colorContext = this.getContext(colorCanvas, true);
    }

    draw(frame: GridFrame) {
        const image = this.getImage(frame.rows, frame.cols);
        const pixels = new Uint32Array(image.data.buffer, image.data.byteOffset, image.data.length / 4);
        const palette = this.resolvePalette(frame.palette);
        for (let index = 0; index < frame.cells.length; index++) {
            pixels[index] = palette[frame.cells[index]];
        }
        this.pixelContext.putImageData(image, 0, 0);

        const width = frame.cols * frame.scale;
        const height = frame.rows * frame.scale;
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.context.imageSmoothingEnabled = false;
        this.context.clearRect(0, 0, width, height);
        this.context.drawImage(this.pixelCanvas, 0, 0, width, height);
        this.drawText(frame);
    }

    private getContext(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
        const context = canvas.getContext('2d', { willReadFrequently });
        if (!context) {
            throw new Error('The browser could not create a canvas context for the grid.');
        }
        return context;
    }

    private getImage(rows: number, cols: number): ImageData {
        if (!this.image || this.image.width !== cols || this.image.height !== rows) {
            this.pixelCanvas.width = cols;
            this.pixelCanvas.height = rows;
            this.image = this.pixelContext.createImageData(cols, rows);
        }
        return this.image;
    }

    private resolvePalette(colors: readonly string[]): number[] {
        const currentColors = new Map<string, number>();
        const palette = colors.map((color) => {
            const value = currentColors.get(color) ?? this.colors.get(color) ?? this.parseColor(color);
            currentColors.set(color, value);
            return value;
        });
        this.colors = currentColors;
        return palette;
    }

    private parseColor(color: string): number {
        this.colorContext.clearRect(0, 0, 1, 1);
        this.colorContext.fillStyle = color;
        this.colorContext.fillRect(0, 0, 1, 1);
        const pixel = this.colorContext.getImageData(0, 0, 1, 1).data;
        return new Uint32Array(pixel.buffer, pixel.byteOffset, 1)[0];
    }

    private drawText(frame: GridFrame) {
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        for (const cell of frame.text) {
            this.context.fillStyle = cell.color;
            this.context.font = `${frame.scale * cell.scale}px Arial`;
            this.context.fillText(
                cell.text,
                (cell.col + 0.5) * frame.scale,
                (cell.row + 0.5) * frame.scale,
                frame.scale * 0.9
            );
        }
    }
}
