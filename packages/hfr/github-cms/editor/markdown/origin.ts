import type { Node } from 'prosemirror-model';
import type { Position } from 'unist';

/**
 * Keeps track of the markdown source a ProseMirror node was parsed from.
 *
 * ProseMirror nodes are immutable and a transaction only replaces the nodes it touches,
 * every untouched node keeps its identity. A node which is still found in this map is
 * therefore unchanged and is serialized with its original markdown, preserving the
 * original formatting.
 */
interface Origin {
    /** the original markdown, with the indentation of the node removed */
    markdown: string;
    /** the full source the node was parsed from */
    source: string;
    start: number;
    end: number;
}

const origins = new WeakMap<Node, Origin>();

export const originalMarkdown = (node: Node): string | undefined => origins.get(node)?.markdown;

/**
 * Remembers the source of a node. Multiline content is dedented by the column the node starts at.
 * When the continuation lines are not indented with plain whitespace (e.g. a paragraph inside a
 * blockquote, where lines start with `> `), the original markdown can not be reused.
 */
export const setOrigin = (node: Node, source: string, position?: Position) => {
    const start = position?.start.offset;
    const end = position?.end.offset;
    if (start === undefined || end === undefined || !position) {
        return;
    }
    const markdown = dedent(source.slice(start, end), position.start.column - 1);
    if (markdown === undefined) {
        return;
    }
    origins.set(node, { markdown, source, start, end });
};

/**
 * Removes `indent` characters from all lines except the first one.
 * Returns `undefined` when a line is not indented with whitespace.
 */
export const dedent = (text: string, indent: number): string | undefined => {
    const [first, ...rest] = text.split('\n');
    const dedented: string[] = [first];
    for (const line of rest) {
        if (line.slice(0, indent).trim() !== '') {
            return undefined;
        }
        dedented.push(line.slice(indent));
    }
    return dedented.join('\n');
};

const WHITESPACE_ONLY = /^\s*$/;
const SEPARATOR_ONLY = /^[\s>]*$/;

/**
 * The separator between two unchanged nodes, when they were direct siblings in the original
 * source too. Blockquote prefixes (`>`) and the indentation of the next line are removed,
 * they are added again when the parent is serialized.
 */
export const originalSeparator = (left: Node, right: Node): string | undefined => {
    const leftOrigin = origins.get(left);
    const rightOrigin = origins.get(right);
    if (!leftOrigin || !rightOrigin || leftOrigin.source !== rightOrigin.source) {
        return undefined;
    }
    if (leftOrigin.end > rightOrigin.start) {
        return undefined;
    }
    const gap = leftOrigin.source.slice(leftOrigin.end, rightOrigin.start);
    if (WHITESPACE_ONLY.test(gap)) {
        return gap.replace(/[ \t]*$/, '');
    }
    if (SEPARATOR_ONLY.test(gap)) {
        return '\n'.repeat(countLineBreaks(gap));
    }
    return undefined;
};

export const countLineBreaks = (text: string) => text.split('\n').length - 1;
