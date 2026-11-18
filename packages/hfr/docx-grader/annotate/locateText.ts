import { PdfPage, PdfText } from './readPdf';

/** Where a text starts: its first line, in PDF points of its page. */
export interface TextBox {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface LocatedChar {
    page: number;
    x: number;
    y: number;
    height: number;
}

/**
 * Only letters and digits are compared: PDFs drop spaces, split ligatures and add hyphens at
 * line ends, so the text of a paragraph is found whatever the line breaks.
 */
export const compactText = (text: string) => {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
};

/** Locates texts in the pages, considering only the texts `include` accepts. */
export const createTextLocator = (
    pages: PdfPage[],
    include: (text: PdfText, page: PdfPage) => boolean = () => true
) => {
    const chars: LocatedChar[] = [];
    let stream = '';
    for (const page of pages) {
        for (const text of page.texts.filter((text) => include(text, page))) {
            const compact = compactText(text.str);
            const charWidth = text.width / Math.max(compact.length, 1);
            [...compact].forEach((char, index) => {
                stream += char;
                chars.push({
                    page: page.index,
                    x: text.x + index * charWidth,
                    y: text.y,
                    height: text.height
                });
            });
        }
    }

    /** The `occurrence`-th place of the text (counted from 0), or undefined when it is not in the PDF. */
    const locate = (text: string, occurrence = 0): TextBox | undefined => {
        const key = compactText(text);
        if (!key) {
            return undefined;
        }
        let start = -1;
        for (let found = 0; found <= occurrence; found++) {
            start = stream.indexOf(key, start + 1);
            if (start < 0) {
                return undefined;
            }
        }
        return firstLineBox(chars.slice(start, start + key.length));
    };

    return { locate };
};

const firstLineBox = (matched: LocatedChar[]): TextBox => {
    const first = matched[0];
    const sameLine = matched.filter(
        (char) => char.page === first.page && Math.abs(char.y - first.y) < first.height / 2
    );
    const lastX = Math.max(...sameLine.map((char) => char.x));
    const charWidth = first.height * 0.5;
    return {
        page: first.page,
        x: first.x,
        y: first.y,
        width: lastX - first.x + charWidth,
        height: first.height
    };
};
