import type { ResolvedPos } from 'prosemirror-model';
import { type Command, type EditorState, Selection, TextSelection } from 'prosemirror-state';
import { canSplit } from 'prosemirror-transform';
import { schema } from '../schema';

const { nodes } = schema;

/** the depth of the innermost item of `:::cards` or `:::flex` around `$pos` */
const itemDepth = ($pos: ResolvedPos) => {
    for (let depth = $pos.depth; depth > 0; depth--) {
        if ($pos.node(depth).type === nodes.directive_item) {
            return depth;
        }
    }
    return null;
};

export const isInDirectiveItem = (state: EditorState) => itemDepth(state.selection.$from) !== null;

/**
 * Starts the next card or column at the cursor: what follows the cursor moves into a new item.
 * At the start of a block, the whole block moves. Where nothing would remain in the
 * current item, an empty item is added after it instead.
 */
export const splitDirectiveItem: Command = (state, dispatch) => {
    const depth = itemDepth(state.selection.$from);
    if (depth === null) {
        return false;
    }
    if (!dispatch) {
        return true;
    }
    const tr = state.tr.deleteSelection();
    const $pos = tr.selection.$from;
    const [splitPos, splitDepth] =
        $pos.parentOffset === 0 ? [$pos.before(), $pos.depth - depth] : [$pos.pos, $pos.depth - depth + 1];
    // a new item without the attributes of the current one, the nodes inside it are copied
    const typesAfter = [{ type: nodes.directive_item }, ...Array(splitDepth - 1).fill(null)];
    if (canSplit(tr.doc, splitPos, splitDepth, typesAfter)) {
        tr.split(splitPos, splitDepth, typesAfter);
    } else {
        const afterItem = $pos.after(depth);
        tr.insert(afterItem, nodes.directive_item.createAndFill()!);
        tr.setSelection(TextSelection.near(tr.doc.resolve(afterItem + 1)));
    }
    dispatch(tr.scrollIntoView());
    return true;
};

/**
 * Enter in an empty last paragraph of an item starts the next item, like in lists.
 * Empty paragraphs are not saved anyway.
 */
export const enterInDirectiveItem: Command = (state, dispatch) => {
    const { $from, empty } = state.selection;
    const item = $from.depth > 1 ? $from.node(-1) : null;
    const isEmptyParagraph = $from.parent.type === nodes.paragraph && $from.parent.content.size === 0;
    if (!empty || !isEmptyParagraph || item?.type !== nodes.directive_item) {
        return false;
    }
    const isLastOfSeveral = item.childCount > 1 && $from.index(-1) === item.childCount - 1;
    return isLastOfSeveral && splitDirectiveItem(state, dispatch);
};

/**
 * Backspace in an empty item removes it, the cursor goes to the end of the previous item.
 * A non-empty item is joined with the previous one by ProseMirror's `joinBackward`.
 */
export const deleteEmptyDirectiveItem: Command = (state, dispatch) => {
    const { $from, empty } = state.selection;
    const depth = itemDepth($from);
    if (!empty || depth === null || $from.depth !== depth + 1) {
        return false;
    }
    const item = $from.node(depth);
    const isEmpty = item.childCount === 1 && item.firstChild!.isTextblock && item.content.size === 2;
    const index = $from.index(depth - 1);
    const previous = index > 0 ? $from.node(depth - 1).child(index - 1) : null;
    if (!isEmpty || previous?.type !== nodes.directive_item) {
        return false;
    }
    if (dispatch) {
        const start = $from.before(depth);
        const tr = state.tr.delete(start, $from.after(depth));
        tr.setSelection(Selection.near(tr.doc.resolve(start), -1));
        dispatch(tr.scrollIntoView());
    }
    return true;
};
