import type { EventSource } from '@tdev/pyodide-code/events';
import { computed } from 'mobx';
import type GridRenderer from './GridRenderer';
import type GridStore from './GridStore';
import type { GridFrame } from './protocol';

export default class Grid {
    readonly id: string;
    readonly store: GridStore;
    readonly eventSource: EventSource;
    private frame?: GridFrame;
    private colorContext?: CanvasRenderingContext2D;
    private readonly renderers = new Set<GridRenderer>();

    constructor(id: string, store: GridStore) {
        this.id = id;
        this.store = store;
        this.eventSource = { extension: store.context.name, targetId: id };
    }

    @computed
    get isConnected(): boolean {
        return this.store.context.events.isConnected(this.eventSource);
    }

    get rows(): number {
        return this.frame?.rows ?? 0;
    }

    get cols(): number {
        return this.frame?.cols ?? 0;
    }

    setFrame(frame: GridFrame) {
        this.validateColors(frame);
        for (const renderer of this.renderers) {
            renderer.draw(frame);
        }
        this.frame = frame;
    }

    attachRenderer(renderer: GridRenderer): () => void {
        if (this.frame) {
            renderer.draw(this.frame);
        }
        this.renderers.add(renderer);
        return () => {
            this.renderers.delete(renderer);
        };
    }

    handleClick(x: number, y: number) {
        const row = Math.floor(y);
        const col = Math.floor(x);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return;
        }
        void this.store.context.events.emit(this.eventSource, { type: 'click', payload: { row, col, x, y } });
    }

    handleKey(key: string) {
        void this.store.context.events.emit(this.eventSource, { type: 'key', payload: { key } });
    }

    private validateColors(frame: GridFrame) {
        const context = this.getColorContext();
        for (const color of [...frame.palette, ...frame.text.map((cell) => cell.color)]) {
            // Canvas ignores unsupported colors; two sentinels distinguish rejection from black or white.
            context.fillStyle = '#000000';
            context.fillStyle = color;
            const parsed = context.fillStyle;
            context.fillStyle = '#ffffff';
            context.fillStyle = color;
            if (context.fillStyle !== parsed) {
                throw new Error(`Invalid grid color: ${color}`);
            }
        }
    }

    private getColorContext(): CanvasRenderingContext2D {
        if (this.colorContext) {
            return this.colorContext;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('The browser could not create a canvas context for grid colors.');
        }
        this.colorContext = context;
        return context;
    }
}
