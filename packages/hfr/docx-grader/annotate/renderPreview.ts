import type { CanvasRenderingContext2D as NodeCanvasContext } from 'canvas';
import { LABEL_COLOR, NOTES_COLOR } from './excalidrawScene';
import { Box, LINE_HEIGHT, PAGE_WIDTH, PageLayout, PlacedText, Point } from './layoutPage';
import { loadCanvas } from './optionalDependencies';

const PADDING = 20;
const ARROWHEAD_LENGTH = 10;

/**
 * The annotated page as a PNG, so it can be shown before anyone opens the markup editor; the
 * editor replaces it with its own export when the scene is saved.
 */
export const renderPreview = async (layout: PageLayout, pagePng: Buffer, pixelRatio: number) => {
    const texts = [...layout.labels, ...(layout.notes ? [layout.notes] : [])];
    const right = Math.max(PAGE_WIDTH, ...texts.map((text) => text.x + text.width)) + PADDING;
    const bottom = Math.max(layout.height, ...texts.map((text) => text.y + text.height)) + PADDING;
    const { createCanvas, loadImage } = await loadCanvas();
    const canvas = createCanvas(right * pixelRatio, bottom * pixelRatio);
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);

    context.fillStyle = 'white';
    context.fillRect(0, 0, right, bottom);
    context.drawImage(await loadImage(pagePng), 0, 0, PAGE_WIDTH, layout.height);
    context.strokeStyle = '#1e1e1e';
    context.setLineDash([2, 3]);
    context.strokeRect(0, 0, PAGE_WIDTH, layout.height);
    context.setLineDash([]);

    context.textBaseline = 'top';
    for (const label of layout.labels) {
        drawText(context, label, LABEL_COLOR);
        drawArrow(context, label.arrow);
        if (label.marker) {
            drawMarker(context, label.marker);
        }
    }
    if (layout.notes) {
        drawText(context, layout.notes, NOTES_COLOR);
    }
    return canvas.toBuffer('image/png');
};

const drawText = (context: NodeCanvasContext, text: PlacedText, color: string) => {
    context.fillStyle = color;
    context.font = `${text.fontSize}px sans-serif`;
    text.lines.forEach((line, index) => {
        context.fillText(line, text.x, text.y + index * text.fontSize * LINE_HEIGHT);
    });
};

const drawMarker = (context: NodeCanvasContext, { x, y, width, height }: Box) => {
    context.strokeStyle = LABEL_COLOR;
    context.strokeRect(x, y, width, height);
};

/** Straight segments with an outlined triangle as head, like Excalidraw's `triangle_outline`. */
const drawArrow = (context: NodeCanvasContext, points: Point[]) => {
    const from = points.at(-2)!;
    const to = points.at(-1)!;
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const corner = (side: number): Point => [
        to[0] - ARROWHEAD_LENGTH * Math.cos(angle + side * 0.4),
        to[1] - ARROWHEAD_LENGTH * Math.sin(angle + side * 0.4)
    ];
    const headBase: Point = [
        to[0] - ARROWHEAD_LENGTH * Math.cos(angle) * Math.cos(0.4),
        to[1] - ARROWHEAD_LENGTH * Math.sin(angle) * Math.cos(0.4)
    ];
    context.strokeStyle = LABEL_COLOR;
    context.beginPath();
    context.moveTo(...points[0]);
    points.slice(1, -1).forEach((point) => context.lineTo(...point));
    context.lineTo(...headBase);
    context.stroke();
    context.beginPath();
    context.moveTo(...to);
    context.lineTo(...corner(-1));
    context.lineTo(...corner(1));
    context.closePath();
    context.stroke();
};
