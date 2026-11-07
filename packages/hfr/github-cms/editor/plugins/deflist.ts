import type { Node } from 'prosemirror-model';
import { type Command, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { schema } from '../schema';

/** `: definition`, see `remark-deflist` */
const DD_MARKER = /^:[ \t]+/;
/** inline nodes (e.g. icons) are represented by this character in the line text */
const INLINE_NODE = '￼';

interface Line {
    from: number;
    to: number;
    text: string;
}

/**
 * Splits the content of a paragraph at its soft line breaks.
 * @param start the position of the paragraph's content
 */
const linesOf = (paragraph: Node, start: number): Line[] => {
    const lines: Line[] = [];
    let lineStart = start;
    let text = '';
    paragraph.forEach((child, offset) => {
        const childPos = start + offset;
        if (!child.isText) {
            text += INLINE_NODE;
            return;
        }
        let index = 0;
        child.text!.split('\n').forEach((part, partIdx) => {
            if (partIdx > 0) {
                lines.push({ from: lineStart, to: childPos + index - 1, text });
                lineStart = childPos + index;
                text = '';
            }
            text += part;
            index += part.length + 1;
        });
    });
    lines.push({ from: lineStart, to: start + paragraph.content.size, text });
    return lines;
};

/**
 * A term followed by its definitions:
 * ```md
 * Term
 * : Definition
 * : Another definition
 * ```
 */
const isDdLine = (line: Line, idx: number) => idx > 0 && DD_MARKER.test(line.text);

const isDeflist = (paragraph: Node) => linesOf(paragraph, 0).some(isDdLine);

const deflistDecorations = (paragraph: Node, pos: number): Decoration[] => {
    const lines = linesOf(paragraph, pos + 1);
    const isDd = lines.map(isDdLine);
    if (!isDd.some((dd) => dd)) {
        return [];
    }
    const decoration = (from: number, to: number, className: string) => {
        return Decoration.inline(from, to, { class: className }, { className });
    };
    const decorations = [
        Decoration.node(pos, pos + paragraph.nodeSize, { class: 'cms-deflist' }, { className: 'cms-deflist' })
    ];
    lines.forEach((line, idx) => {
        if (isDd[idx]) {
            const markerEnd = line.from + line.text.match(DD_MARKER)![0].length;
            decorations.push(decoration(line.from, markerEnd, 'cms-dd-marker'));
            decorations.push(decoration(markerEnd, line.to, 'cms-dd'));
            return;
        }
        if (isDd[idx + 1] && line.from < line.to) {
            decorations.push(decoration(line.from, line.to, 'cms-dt'));
        }
    });
    return decorations;
};

export const decorationsOf = (doc: Node) => {
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.type !== schema.nodes.paragraph) {
            return !node.isTextblock;
        }
        decorations.push(...deflistDecorations(node, pos));
        return false;
    });
    return DecorationSet.create(doc, decorations);
};

/**
 * The lines of a definition list must stay in the same paragraph: enter inserts a line break.
 * Enter at the start of a line (e.g. on the empty line after the last definition) leaves the
 * definition list: the rest of the paragraph becomes a new paragraph. Two consecutive line
 * breaks would end the paragraph in markdown anyway.
 */
export const enterInDeflist: Command = (state, dispatch) => {
    const { $from, empty } = state.selection;
    if (!empty || $from.parent.type !== schema.nodes.paragraph || !isDeflist($from.parent)) {
        return false;
    }
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, INLINE_NODE);
    if (!dispatch) {
        return true;
    }
    if (before.endsWith('\n')) {
        const lineBreak = $from.pos - 1;
        dispatch(state.tr.delete(lineBreak, $from.pos).split(lineBreak).scrollIntoView());
        return true;
    }
    dispatch(state.tr.insertText('\n').scrollIntoView());
    return true;
};

/**
 * Renders definition lists (`remark-deflist`) like a definition list: bold terms and indented
 * definitions. The markdown stays a paragraph, only its lines are styled.
 */
export const deflist = () =>
    new Plugin<DecorationSet>({
        state: {
            init: (_, state) => decorationsOf(state.doc),
            apply: (tr, decorations) => (tr.docChanged ? decorationsOf(tr.doc) : decorations)
        },
        props: {
            decorations(state) {
                return this.getState(state);
            }
        }
    });
