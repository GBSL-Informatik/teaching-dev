import { InputRule } from 'prosemirror-inputrules';
import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import { schema } from '../schema';

const { marks } = schema;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Matches `open content close` followed by the typed space. The content must not start or end
 * with whitespace, and the opening delimiter must not follow a word, e.g. in `snake_case_name`.
 * Excluding the delimiter characters keeps `*` from closing an emphasis inside `**bold**`.
 */
const markPattern = (open: string, close: string): RegExp => {
    const openChar = escapeRegExp(open[0]);
    const closeChar = escapeRegExp(close[close.length - 1]);
    const content = `[^\\s${openChar}](?:[^${closeChar}]*[^\\s${closeChar}])?`;
    return new RegExp(`(?<![\\w${openChar}])${escapeRegExp(open)}(${content})${escapeRegExp(close)} $`);
};

/** e.g. while typing `` `a *b* c` ``, where `*b*` is code and not an emphasis */
const isInOpenCodeSpan = (state: EditorState, pos: number): boolean => {
    const $pos = state.doc.resolve(pos);
    const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\ufffc');
    const backtickCount = textBefore.split('`').length - 1;
    return backtickCount % 2 === 1;
};

/**
 * Typing a space after the closing delimiter, e.g. `**bold** `, replaces the delimiters by the mark.
 */
const markInputRule = (open: string, close: string, markType: MarkType): InputRule => {
    return new InputRule(
        markPattern(open, close),
        (state, match, start, end) => {
            if (markType !== marks.code && isInOpenCodeSpan(state, start)) {
                return null;
            }
            const content = match[1];
            const contentStart = start + open.length;
            const contentEnd = contentStart + content.length;
            const markedEnd = start + content.length;
            const tr = state.tr
                .delete(contentEnd, end)
                .delete(start, contentStart)
                .addMark(start, markedEnd, markType.create());

            // the typed space is not in the doc yet, insert it without the new mark
            const marksAfter = markType.removeFromSet(tr.doc.resolve(markedEnd).marks());
            return tr.insert(markedEnd, schema.text(' ', marksAfter));
        },
        { inCodeMark: false }
    );
};

export const markInputRules: InputRule[] = [
    markInputRule('**', '**', marks.strong),
    markInputRule('__', '__', marks.box),
    markInputRule('*', '*', marks.emphasis),
    markInputRule('_', '_', marks.emphasis),
    markInputRule('~~', '~~', marks.delete),
    markInputRule('[[', ']]', marks.kbd),
    markInputRule('`', '`', marks.code)
];
