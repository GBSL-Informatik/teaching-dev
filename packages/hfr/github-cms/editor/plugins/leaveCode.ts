import type { Mark } from 'prosemirror-model';
import { type Command, type EditorState, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

/** inline code and inline mdx */
const isCodeMark = (mark: Mark) => !!mark.type.spec.code;

/**
 * At the start or end of a textblock, the first arrow key press leaves the inline code or mdx at the cursor,
 * so typed text is no longer code. Only the second press moves to the adjacent block, e.g. from the
 * label of a `:::def` to its content.
 */
export const arrowOutOfCode = (direction: 'left' | 'right'): Command => {
    return (state, dispatch, view) => {
        const { $from, empty } = state.selection;
        if (!empty || !view?.endOfTextblock(direction)) {
            return false;
        }
        const activeMarks = state.storedMarks ?? $from.marks();
        const codeMark = activeMarks.find(isCodeMark);
        if (!codeMark) {
            return false;
        }
        dispatch?.(state.tr.setStoredMarks(codeMark.removeFromSet(activeMarks)));
        return true;
    };
};

/**
 * A second space at the end of inline code or mdx leaves it: the first space is moved out of it.
 * E.g. to continue with text after `<Foo />` in the middle of a paragraph, where the arrow keys move on.
 */
const spaceOutOfCode = (view: EditorView, from: number, to: number, text: string) => {
    if (text !== ' ' || from !== to) {
        return false;
    }
    const { state } = view;
    const $pos = state.doc.resolve(from);
    const before = $pos.nodeBefore;
    const codeMark = before?.marks.find(isCodeMark);
    if (!before?.text?.endsWith(' ') || !codeMark) {
        return false;
    }
    const isAtEndOfCode = !codeMark.isInSet($pos.nodeAfter?.marks ?? []);
    if (!isAtEndOfCode) {
        return false;
    }
    // the cursor takes the marks of the space before it, so it is outside the code too
    view.dispatch(state.tr.removeMark(from - 1, from, codeMark));
    return true;
};

/** the cursor next to inline code it left with `arrowOutOfCode`, otherwise the browser shows it inside */
const cursorOutsideCode = (state: EditorState) => {
    const { $from, empty } = state.selection;
    const { storedMarks } = state;
    if (!empty || !storedMarks) {
        return DecorationSet.empty;
    }
    const hasLeftCode = !storedMarks.some(isCodeMark) && $from.marks().some(isCodeMark);
    if (!hasLeftCode) {
        return DecorationSet.empty;
    }
    // the cursor is placed on the other side of the widget, which is rendered outside the code
    const side = $from.parentOffset === 0 ? 1 : -1;
    const widget = Decoration.widget($from.pos, () => document.createElement('span'), {
        side,
        marks: storedMarks,
        key: `cursor-outside-code${side}`
    });
    return DecorationSet.create(state.doc, [widget]);
};

export const leaveCode = () => {
    return new Plugin({ props: { decorations: cursorOutsideCode, handleTextInput: spaceOutOfCode } });
};
