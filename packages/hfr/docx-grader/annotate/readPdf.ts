import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import { loadCanvas } from './optionalDependencies';

/** A text fragment of a page, in PDF points with the origin at the top left. */
export interface PdfText {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PdfPage {
    index: number;
    widthPt: number;
    heightPt: number;
    texts: PdfText[];
    /** PNG of the page, `scale` pixels per point. */
    renderPng: (scale: number) => Promise<Buffer>;
}

export interface Pdf {
    pages: PdfPage[];
    /** Frees pdf.js' resources once all pages are rendered. */
    close: () => Promise<void>;
}

/** Reads the pages of a PDF exported from Word: their size, text positions and a renderer. */
export const readPdf = async (data: Uint8Array): Promise<Pdf> => {
    const document = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
    const pages: PdfPage[] = [];
    for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const texts = content.items
            .filter(isTextItem)
            .filter((item) => item.str.trim())
            .map(({ str, transform, width, height }) => {
                const textHeight = height || Math.abs(transform[3]);
                return {
                    str,
                    x: transform[4],
                    y: viewport.height - transform[5] - textHeight,
                    width,
                    height: textHeight
                };
            });
        pages.push({
            index: number - 1,
            widthPt: viewport.width,
            heightPt: viewport.height,
            texts,
            renderPng: async (scale) => {
                const scaled = page.getViewport({ scale });
                const { createCanvas } = await loadCanvas();
                const canvas = createCanvas(scaled.width, scaled.height);
                // pdf.js draws on the `canvas` package's context like on a browser canvas.
                const context = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
                await page.render({ canvasContext: context, viewport: scaled }).promise;
                return canvas.toBuffer('image/png');
            }
        });
    }
    return { pages, close: () => document.destroy() };
};

const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem => 'str' in item;
