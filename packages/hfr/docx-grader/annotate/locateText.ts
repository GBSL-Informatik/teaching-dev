import { PdfPage, PdfText } from './readPdf';

/** Where a text starts: its first line, in PDF points of its page. */
export interface TextBox {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Right edge of all text on the same line of the page, including other columns. */
    lineRight: number;
}

interface LocatedChar {
    page: number;
    x: number;
    y: number;
    width: number;
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
                    width: charWidth,
                    height: text.height
                });
            });
        }
    }

    /** The `occurrence`-th match of the text (counted from 0) as index into `chars`. */
    const indexOf = (key: string, occurrence: number): number | undefined => {
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
        return start;
    };

    const boxOf = (line: LocatedChar[]): TextBox => {
        const first = line[0];
        const right = (char: LocatedChar) => char.x + char.width;
        const wholeLine = chars.filter((char) => isOnLineOf(first, char));
        return {
            page: first.page,
            x: first.x,
            y: first.y,
            width: Math.max(...line.map(right)) - first.x,
            height: first.height,
            lineRight: Math.max(...wholeLine.map(right))
        };
    };

    /** The first line of the `occurrence`-th place of the text, or undefined when it is not in the PDF. */
    const locate = (text: string, occurrence = 0): TextBox | undefined => {
        const key = compactText(text);
        const start = indexOf(key, occurrence);
        if (start === undefined) {
            return undefined;
        }
        return boxOf(firstLine(chars.slice(start, start + key.length)));
    };

    /** Like `locate`, up to the end of the line in its column: the first line of a paragraph starting with the text. */
    const locateLine = (text: string, occurrence = 0): TextBox | undefined => {
        const start = indexOf(compactText(text), occurrence);
        if (start === undefined) {
            return undefined;
        }
        return boxOf(firstLine(chars.slice(start)));
    };

    return { locate, locateLine };
};

const isOnLineOf = (first: LocatedChar, char: LocatedChar) => {
    return char.page === first.page && Math.abs(char.y - first.y) < first.height / 2;
};

/** The characters up to the first line break; pdf.js lists the lines of a column one after another. */
const firstLine = (chars: LocatedChar[]): LocatedChar[] => {
    const end = chars.findIndex((char) => !isOnLineOf(chars[0], char));
    return end < 0 ? chars : chars.slice(0, end);
};
