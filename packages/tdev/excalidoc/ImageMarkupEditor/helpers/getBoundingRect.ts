import { ExcalidrawElement, ExcalidrawFreeDrawElement } from '@excalidraw/excalidraw/element/types';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const normalizeRotation = (element: ExcalidrawElement) => {
    if (!element.angle || element.angle === 0) {
        return {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            strokeWidth: element.strokeWidth
        };
    }
    const sin = Math.sin(element.angle);
    const cos = Math.cos(element.angle);
    const width = Math.abs(element.width * cos) + Math.abs(element.height * sin);
    const height = Math.abs(element.width * sin) + Math.abs(element.height * cos);
    const x = element.x + (element.width - width) / 2;
    const y = element.y + (element.height - height) / 2;
    return { x, y, width, height, strokeWidth: element.strokeWidth };
};

export const getBoundingRect = (elements: readonly ExcalidrawElement[]): Rect => {
    if (elements.length === 0) {
        return { x: 0, y: 0, width: 400, height: 300 };
    }
    const normalized = elements.map((e) => normalizeRotation(e));

    const minX = Math.min(...normalized.map((e) => e.x - e.strokeWidth / 2));
    const minY = Math.min(...normalized.map((e) => e.y - e.strokeWidth / 2));
    const maxX = Math.max(...normalized.map((e) => e.x + e.width + e.strokeWidth / 2));
    const maxY = Math.max(...normalized.map((e) => e.y + e.height + e.strokeWidth / 2));
    return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1)
    };
};
