import { ExcalidrawElement, ExcalidrawFreeDrawElement } from '@excalidraw/excalidraw/element/types';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const getBoundingRect = (elements: readonly ExcalidrawElement[]): Rect => {
    if (elements.length === 0) {
        return { x: 0, y: 0, width: 400, height: 300 };
    }
    const minX = Math.min(...elements.map((e) => e.x - e.strokeWidth / 2));
    const minY = Math.min(...elements.map((e) => e.y - e.strokeWidth / 2));
    const maxX = Math.max(...elements.map((e) => e.x + e.width + e.strokeWidth / 2));
    const maxY = Math.max(...elements.map((e) => e.y + e.height + e.strokeWidth / 2));
    return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1)
    };
};
