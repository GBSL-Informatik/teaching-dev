import type { FileId } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles, DataURL } from '@excalidraw/excalidraw/types';

interface Point {
    x: number;
    y: number;
}

const SLIDE_GAP = 100;

/**
 * Shared state of one conversion: the origin of the current slide, to which all positions are relative,
 * the element ids and the embedded files.
 */
export default class ConversionContext {
    readonly files: BinaryFiles = {};
    private readonly article: Element;
    private origin: Point = { x: 0, y: 0 };
    private idCount = 0;
    private fileIdsByDataUrl = new Map<string, FileId>();

    constructor(article: Element) {
        this.article = article;
    }

    /**
     * Places the slide to the right of the previous ones, starting at the top of its first block.
     */
    startSlide(firstBlock: Element, slideIndex: number) {
        const articleRect = this.article.getBoundingClientRect();
        const slideOffset = slideIndex * (articleRect.width + SLIDE_GAP);
        this.origin = {
            x: articleRect.left - slideOffset,
            y: firstBlock.getBoundingClientRect().top
        };
    }

    toScene(rect: DOMRect): Point {
        return { x: rect.left - this.origin.x, y: rect.top - this.origin.y };
    }

    nextId(): string {
        this.idCount += 1;
        return `tdev-${this.idCount}`;
    }

    /**
     * Embeds the file once, even when it is shown several times.
     */
    addFile(dataUrl: string): FileId {
        const existingId = this.fileIdsByDataUrl.get(dataUrl);
        if (existingId) {
            return existingId;
        }
        const id = this.nextId() as FileId;
        this.fileIdsByDataUrl.set(dataUrl, id);
        this.files[id] = {
            id,
            dataURL: dataUrl as DataURL,
            mimeType: mimeTypeOf(dataUrl),
            created: Date.now()
        };
        return id;
    }
}

const mimeTypeOf = (dataUrl: string) => {
    const mimeType = /^data:([^;,]+)/.exec(dataUrl)?.[1] ?? 'image/png';
    return mimeType as BinaryFiles[FileId]['mimeType'];
};
