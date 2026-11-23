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
    /** Word's tagged PDFs mark headers and footers as artifacts, i.e. not part of the content. */
    isArtifact: boolean;
}

export interface PdfPage {
    index: number;
    widthPt: number;
    heightPt: number;
    texts: PdfText[];
    /** Whether the page has marked content, which Word's PDF export adds unless its tags are turned off. */
    isTagged: boolean;
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
        const content = await page.getTextContent({ includeMarkedContent: true });
        pages.push({
            index: number - 1,
            widthPt: viewport.width,
            heightPt: viewport.height,
            texts: textsOf(content.items, viewport.height),
            isTagged: content.items.some((item) => !isTextItem(item)),
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

// pdf.js sets the tag of marked content, but does not declare it.
type MarkedContent = TextMarkedContent & { tag?: string };

const textsOf = (items: (TextItem | MarkedContent)[], pageHeight: number): PdfText[] => {
    const texts: PdfText[] = [];
    const openTags: string[] = [];
    for (const item of items) {
        if (!isTextItem(item)) {
            if (item.type === 'endMarkedContent') {
                openTags.pop();
            } else {
                openTags.push(item.tag ?? '');
            }
            continue;
        }
        if (!item.str.trim()) {
            continue;
        }
        const { str, transform, width, height } = item;
        const textHeight = height || Math.abs(transform[3]);
        texts.push({
            str,
            x: transform[4],
            y: pageHeight - transform[5] - textHeight,
            width,
            height: textHeight,
            isArtifact: openTags.includes('Artifact')
        });
    }
    return texts;
};

const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem => 'str' in item;
