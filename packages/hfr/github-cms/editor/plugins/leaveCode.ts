import { type Command, type EditorState, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { schema } from '../schema';

const { code } = schema.marks;

/**
 * At the start or end of a textblock, the first arrow key press leaves the inline code at the cursor,
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
        if (!code.isInSet(activeMarks)) {
            return false;
        }
        dispatch?.(state.tr.setStoredMarks(code.removeFromSet(activeMarks)));
        return true;
    };
};

/** the cursor next to inline code it left with `arrowOutOfCode`, otherwise the browser shows it inside */
const cursorOutsideCode = (state: EditorState) => {
    const { $from, empty } = state.selection;
    if (!empty || !state.storedMarks || code.isInSet(state.storedMarks) || !code.isInSet($from.marks())) {
        return DecorationSet.empty;
    }
    // the cursor is placed on the other side of the widget, which is rendered outside the code
    const side = $from.parentOffset === 0 ? 1 : -1;
    const widget = Decoration.widget($from.pos, () => document.createElement('span'), {
        side,
        marks: state.storedMarks,
        key: `cursor-outside-code${side}`
    });
    return DecorationSet.create(state.doc, [widget]);
};

export const leaveCode = () => new Plugin({ props: { decorations: cursorOutsideCode } });
