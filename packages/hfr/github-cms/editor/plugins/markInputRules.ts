import { InputRule } from 'prosemirror-inputrules';
import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import { schema } from '../schema';

const { marks } = schema;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Matches `open content close` at the end of the typed text. The content must not start or end
 * with whitespace. As in markdown, `_` must not follow a word, e.g. in `snake_case_name`, while
 * other delimiters may, e.g. in `e.g**bold**`.
 * Excluding the delimiter characters keeps `*` from closing an emphasis inside `**bold**`.
 */
const markPattern = (open: string, close: string): RegExp => {
    const openChar = escapeRegExp(open[0]);
    const closeChar = escapeRegExp(close[close.length - 1]);
    const content = `[^\\s${openChar}](?:[^${closeChar}]*[^\\s${closeChar}])?`;
    const notBefore = open[0] === '_' ? `\\w${openChar}` : openChar;
    return new RegExp(`(?<![${notBefore}])${escapeRegExp(open)}(${content})${escapeRegExp(close)}$`);
};

/** e.g. while typing `` `a *b* c` ``, where `*b*` is code and not an emphasis */
const isInOpenCodeSpan = (state: EditorState, pos: number): boolean => {
    const $pos = state.doc.resolve(pos);
    const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\ufffc');
    const backtickCount = textBefore.split('`').length - 1;
    return backtickCount % 2 === 1;
};

/**
 * Typing the closing delimiter, e.g. the last `*` of `**bold**`, replaces the delimiters by the mark.
 */
const markInputRule = (open: string, close: string, markType: MarkType): InputRule => {
    return new InputRule(
        markPattern(open, close),
        (state, match, start, end) => {
            if (markType !== marks.code && isInOpenCodeSpan(state, start)) {
                return null;
            }
            const contentStart = start + open.length;
            const contentEnd = contentStart + match[1].length;
            // `end` is before the last typed character, so only the rest of the closing delimiter is in the doc
            return state.tr
                .delete(contentEnd, end)
                .delete(start, contentStart)
                .addMark(start, start + match[1].length, markType.create())
                .removeStoredMark(markType);
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
