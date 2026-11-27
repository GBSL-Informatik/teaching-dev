import type { ExcalidrawTextElement } from '@excalidraw/excalidraw/element/types';
import { toExcalidrawColor } from './colors';
import ConversionContext from './ConversionContext';
import { isIgnored, isInlineFlow } from './dom';
import { FontFamily, Skeleton } from './types';

/** approximate width of a character relative to the font size */
const MARKER_CHAR_WIDTH = 0.55;
/** the widest character of Comic Shanns, the (nearly) monospace code font of Excalidraw, relative to the font size */
const CODE_CHAR_WIDTH = 0.6;

interface TextLine {
    text: string;
    left: number;
    top: number;
    height: number;
}

/**
 * Converts the text of a block to a text element, keeping the line breaks of the browser.
 * Text of nested blocks is converted separately.
 */
export const textSkeletons = (
    block: Element,
    style: CSSStyleDeclaration,
    context: ConversionContext
): Skeleton[] => {
    const runs = inlineRuns(block)
        .map(readLines)
        .filter((lines) => lines.length > 0);
    if (runs.length === 0) {
        return [];
    }
    const marker = listMarker(block);
    if (runs.length === 1) {
        return [paragraph(runs[0], marker, style, context)];
    }
    // Excalidraw text can not leave gaps for inline images or formulas, so each line is placed on its own
    return runs.flat().map((line, idx) => paragraph([line], idx === 0 ? marker : undefined, style, context));
};

const paragraph = (
    lines: TextLine[],
    marker: string | undefined,
    style: CSSStyleDeclaration,
    context: ConversionContext
): Skeleton => {
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = lineHeightInPx(style, fontSize);
    // the marker is placed left of the text, as the browser does
    const markerWidth = marker ? marker.length * fontSize * MARKER_CHAR_WIDTH : 0;
    const firstLine = lines[0];
    const left = Math.min(...lines.map((line) => line.left)) - markerWidth;
    // the line box is centered in the line height, which is larger than the glyphs measured by the range
    const top = firstLine.top - (lineHeight - firstLine.height) / 2;

    return {
        type: 'text',
        id: context.nextId(),
        ...context.toScene(new DOMRect(left, top)),
        text: withMarker(
            marker,
            lines.map((line) => line.text)
        ).join('\n'),
        fontSize,
        fontFamily: FontFamily.Nunito,
        lineHeight: (lineHeight / fontSize) as ExcalidrawTextElement['lineHeight'],
        strokeColor: toExcalidrawColor(style.color),
        textAlign: style.textAlign === 'center' || style.textAlign === 'right' ? style.textAlign : 'left'
    };
};

/**
 * Converts a code block to monospace text. Its lines are kept as they are, without wrapping.
 */
export const codeSkeleton = (
    pre: HTMLPreElement,
    style: CSSStyleDeclaration,
    context: ConversionContext
): Skeleton | undefined => {
    const code = codeText(pre);
    if (code.trim().length === 0) {
        return;
    }
    const rect = pre.getBoundingClientRect();
    const fontSize = parseFloat(style.fontSize);
    const contentLeft = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const contentTop = rect.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);

    const longestLine = Math.max(...code.split('\n').map((line) => line.length));

    return {
        type: 'text',
        id: context.nextId(),
        ...context.toScene(new DOMRect(contentLeft, contentTop)),
        // Excalidraw would measure the text with the fonts of this page, where its code font is missing,
        // and the too small width would clip the end of the lines.
        width: longestLine * fontSize * CODE_CHAR_WIDTH,
        text: code,
        fontSize,
        fontFamily: FontFamily.ComicShanns,
        lineHeight: (lineHeightInPx(style, fontSize) / fontSize) as ExcalidrawTextElement['lineHeight'],
        strokeColor: toExcalidrawColor(style.color)
    };
};

/**
 * Docusaurus renders each code line as a block ending with a `<br>`, so `innerText` would double the line breaks.
 */
const codeText = (pre: HTMLPreElement) => {
    const lines = pre.querySelectorAll('.token-line');
    if (lines.length === 0) {
        return pre.innerText.replace(/\n$/, '');
    }
    return Array.from(lines, (line) => line.textContent ?? '').join('\n');
};

const lineHeightInPx = (style: CSSStyleDeclaration, fontSize: number) => {
    const lineHeight = parseFloat(style.lineHeight);
    // `line-height: normal` is computed as 'normal'
    return Number.isNaN(lineHeight) ? fontSize * 1.2 : lineHeight;
};

/**
 * Collects the text nodes flowing in the block, split into runs at every element that interrupts the text,
 * e.g. an inline formula or a nested list.
 */
const inlineRuns = (block: Element): Text[][] => {
    const runs: Text[][] = [[]];
    const collect = (element: Element) => {
        element.childNodes.forEach((child) => {
            if (child instanceof Text) {
                runs[runs.length - 1].push(child);
                return;
            }
            if (!(child instanceof Element) || isIgnored(child)) {
                return;
            }
            if (isInlineFlow(child, getComputedStyle(child))) {
                collect(child);
                return;
            }
            runs.push([]);
        });
    };
    collect(block);
    return runs;
};

/**
 * Splits the text into words and measures each word to find the lines the browser wrapped it into.
 */
const readLines = (textNodes: Text[]): TextLine[] => {
    const lines: TextLine[] = [];
    let currentLine: TextLine | undefined;
    for (const textNode of textNodes) {
        let offset = 0;
        for (const token of textNode.data.split(/(\s+)/)) {
            const rect = !/^\s*$/.test(token) && measureToken(textNode, offset, token.length);
            offset += token.length;
            if (rect && (!currentLine || rect.top >= currentLine.top + currentLine.height / 2)) {
                currentLine = { text: '', left: rect.left, top: rect.top, height: rect.height };
                lines.push(currentLine);
            }
            if (!currentLine) {
                continue;
            }
            currentLine.text += token;
            if (rect) {
                currentLine.left = Math.min(currentLine.left, rect.left);
            }
        }
    }
    return lines
        .map((line) => ({ ...line, text: line.text.replace(/\s+/g, ' ').trim() }))
        .filter((line) => line.text.length > 0);
};

const measureToken = (textNode: Text, offset: number, length: number): DOMRect | undefined => {
    const range = document.createRange();
    range.setStart(textNode, offset);
    range.setEnd(textNode, offset + length);
    // a word hyphenated over two lines has two rects, it starts on the first one
    return range.getClientRects()[0];
};

const withMarker = (marker: string | undefined, lines: string[]): string[] => {
    if (!marker) {
        return lines;
    }
    const indent = ' '.repeat(marker.length);
    return lines.map((line, idx) => (idx === 0 ? `${marker}${line}` : `${indent}${line}`));
};

const listMarker = (block: Element): string | undefined => {
    const list = block.parentElement;
    if (block.tagName !== 'LI' || !list) {
        return;
    }
    if (!(list instanceof HTMLOListElement)) {
        return '• ';
    }
    const position = Array.from(list.children).indexOf(block);
    return `${list.start + position}. `;
};
