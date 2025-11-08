import { ExcalidrawElement, ExcalidrawFreeDrawElement } from '@excalidraw/excalidraw/element/types';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const extractMinX = (element: ExcalidrawFreeDrawElement): number => {
    const xs = element.points.map((p) => p[0]);
    return Math.min(...xs) + element.x - 2 * element.strokeWidth;
};

const extractMaxX = (element: ExcalidrawFreeDrawElement): number => {
    return element.x + element.width;
};

const extractMinY = (element: ExcalidrawFreeDrawElement): number => {
    const ys = element.points.map((p) => p[1]);
    return element.y + element.height - Math.abs(Math.max(...ys)) - 2.1 * element.strokeWidth;
};

const extractMaxY = (element: ExcalidrawFreeDrawElement): number => {
    const ys = element.points.map((p) => p[1]);
    return element.y + Math.max(...ys) + 2.1 * element.strokeWidth;
};

export const getBoundingRect = (elements: readonly ExcalidrawElement[]): Rect => {
    const minX = Math.min(
        ...elements.map((e) => (e.type === 'freedraw' ? extractMinX(e) : e.x - e.strokeWidth / 2))
    );
    const minY = Math.min(
        ...elements.map((e) => (e.type === 'freedraw' ? extractMinY(e) : e.y - e.strokeWidth / 2))
    );
    const maxX = Math.max(
        ...elements.map((e) => (e.type === 'freedraw' ? extractMaxX(e) : e.x + e.width + e.strokeWidth / 2))
    );
    const maxY = Math.max(
        ...elements.map((e) => (e.type === 'freedraw' ? extractMaxY(e) : e.y + e.height + e.strokeWidth / 2))
    );
    return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1)
    };
};
