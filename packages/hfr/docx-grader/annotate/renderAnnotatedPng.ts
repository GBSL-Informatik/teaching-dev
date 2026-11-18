import { createCanvas, loadImage } from 'canvas';
import { ANNOTATION_COLOR } from './excalidrawScene';
import { FONT_SIZE, LINE_HEIGHT, PAGE_WIDTH, PageLayout } from './layoutPage';

const PADDING = 20;

/**
 * The annotated page as an image, so it can be shown before anyone opens the markup editor; the
 * editor replaces it with its own export when the scene is saved.
 */
export const renderAnnotatedPng = async (layout: PageLayout, pagePng: Buffer, pixelRatio: number) => {
    const labelsRight = Math.max(PAGE_WIDTH, ...layout.labels.map((label) => label.x + label.width));
    const labelsBottom = Math.max(layout.height, ...layout.labels.map((label) => label.y + label.height));
    const canvas = createCanvas((labelsRight + PADDING) * pixelRatio, (labelsBottom + PADDING) * pixelRatio);
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);

    context.fillStyle = 'white';
    context.fillRect(0, 0, labelsRight + PADDING, labelsBottom + PADDING);
    context.drawImage(await loadImage(pagePng), 0, 0, PAGE_WIDTH, layout.height);
    context.strokeStyle = '#1e1e1e';
    context.setLineDash([2, 3]);
    context.strokeRect(0, 0, PAGE_WIDTH, layout.height);
    context.setLineDash([]);

    context.fillStyle = ANNOTATION_COLOR;
    context.strokeStyle = ANNOTATION_COLOR;
    context.font = `italic ${FONT_SIZE}px sans-serif`;
    context.textBaseline = 'top';
    for (const label of layout.labels) {
        label.lines.forEach((line, index) => {
            context.fillText(line, label.x, label.y + index * FONT_SIZE * LINE_HEIGHT);
        });
        if (label.arrow) {
            drawArrow(context, label.arrow.from, label.arrow.to);
        }
    }
    return canvas.toBuffer('image/png');
};

const drawArrow = (
    context: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
    from: [number, number],
    to: [number, number]
) => {
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const headLength = 8;
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.lineTo(to[0] - headLength * Math.cos(angle - 0.4), to[1] - headLength * Math.sin(angle - 0.4));
    context.moveTo(...to);
    context.lineTo(to[0] - headLength * Math.cos(angle + 0.4), to[1] - headLength * Math.sin(angle + 0.4));
    context.stroke();
};
