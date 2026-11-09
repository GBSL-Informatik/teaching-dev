import type { Node } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { schema } from '../schema';

/** `::br` separates the items of `:::cards` and `:::flex` */
export const isItemBreak = (node: Node | null): node is Node =>
    !!node && node.type === schema.nodes.leaf_directive && node.attrs.name === 'br';

/** the `::br` right before the block of the cursor, with that block when it is empty */
const itemBreakBeforeCursor = (state: EditorState) => {
    const { $cursor } = state.selection as TextSelection;
    if (!$cursor || $cursor.parentOffset > 0) {
        return null;
    }
    const containerDepth = $cursor.depth - 1;
    const index = $cursor.index(containerDepth);
    const before = index > 0 ? $cursor.node(containerDepth).child(index - 1) : null;
    if (!isItemBreak(before)) {
        return null;
    }
    const blockStart = $cursor.before();
    const isEmpty = $cursor.parent.content.size === 0;
    return { from: blockStart - before.nodeSize, to: isEmpty ? $cursor.after() : blockStart };
};

const selectedItemBreak = (state: EditorState) => {
    const { selection } = state;
    if (!(selection instanceof NodeSelection) || !isItemBreak(selection.node)) {
        return null;
    }
    return { from: selection.from, to: selection.to };
};

/**
 * Backspace after a `::br` merges the item into the previous one, the cursor goes to the end
 * of the previous item. By default, the cursor would end up after the `:::cards` or `:::flex`.
 */
export const deleteItemBreak: Command = (state, dispatch) => {
    const range = itemBreakBeforeCursor(state) ?? selectedItemBreak(state);
    if (!range) {
        return false;
    }
    if (dispatch) {
        const tr = state.tr.delete(range.from, range.to);
        tr.setSelection(Selection.near(tr.doc.resolve(range.from), -1));
        dispatch(tr.scrollIntoView());
    }
    return true;
};
