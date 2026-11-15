import type { ResolvedPos } from 'prosemirror-model';
import { type Command, type EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import { schema } from '../schema';

const { nodes } = schema;

// Isolating nodes (directives, jsx components, tables) can not be left with ProseMirror's commands,
// e.g. `liftEmptyBlock`. Followed by a code block or another directive, there is no cursor position
// in between, so no paragraph could be added after them without these commands.

/** the depth of the innermost isolating node around `$pos`, when `$pos` is at the end of its content */
const isolatingNodeEndingAt = ($pos: ResolvedPos) => {
    if ($pos.parentOffset < $pos.parent.content.size) {
        return null;
    }
    for (let depth = $pos.depth - 1; depth > 0; depth--) {
        const node = $pos.node(depth);
        if ($pos.index(depth) < node.childCount - 1) {
            return null;
        }
        if (node.type.spec.isolating) {
            return depth;
        }
    }
    return null;
};

/**
 * The range of the empty paragraph at `$pos`, together with its ancestors below `containerDepth`
 * which contain nothing else (e.g. an empty card). Null if it can not be removed.
 */
const emptyBlockRange = ($pos: ResolvedPos, containerDepth: number) => {
    if ($pos.parent.type !== nodes.paragraph || $pos.parent.content.size > 0) {
        return null;
    }
    let depth = $pos.depth;
    while (depth - 1 > containerDepth && $pos.node(depth - 1).childCount === 1) {
        depth--;
    }
    const index = $pos.index(depth - 1);
    if (!$pos.node(depth - 1).canReplace(index, index + 1)) {
        return null;
    }
    return { depth, from: $pos.before(depth), to: $pos.after(depth) };
};

/** moves the cursor into a new paragraph after the node at `depth`, an empty paragraph at the cursor is moved there */
const leave = (state: EditorState, depth: number, dispatch?: (tr: Transaction) => void) => {
    const { $from } = state.selection;
    const index = $from.index(depth - 1) + 1;
    if (!$from.node(depth - 1).canReplaceWith(index, index, nodes.paragraph)) {
        return false;
    }
    if (dispatch) {
        const after = $from.after(depth);
        const tr = state.tr.insert(after, nodes.paragraph.create());
        tr.setSelection(TextSelection.create(tr.doc, after + 1));
        const emptyBlock = emptyBlockRange($from, depth);
        if (emptyBlock) {
            tr.delete(emptyBlock.from, emptyBlock.to);
        }
        dispatch(tr.scrollIntoView());
    }
    return true;
};

/**
 * Mod-Enter at the end of a directive, jsx component or table continues after it.
 */
export const leaveIsolatingNode: Command = (state, dispatch) => {
    const { $from, empty } = state.selection;
    const depth = empty ? isolatingNodeEndingAt($from) : null;
    // Mod-Enter starts the next card there, see `splitDirectiveItem`
    if (depth === null || $from.node(depth).type === nodes.items_directive) {
        return false;
    }
    return leave(state, depth, dispatch);
};

/**
 * Enter in an empty paragraph at the end of a directive or jsx component continues after it, like in lists.
 * In `:::cards`, Enter in an empty last card continues after the cards.
 */
export const enterAtEndOfIsolatingNode: Command = (state, dispatch) => {
    const { $from, empty } = state.selection;
    const depth = empty ? isolatingNodeEndingAt($from) : null;
    if (depth === null || emptyBlockRange($from, depth)?.depth !== depth + 1) {
        return false;
    }
    return leave(state, depth, dispatch);
};
