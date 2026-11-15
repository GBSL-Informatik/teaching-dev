import type { Node } from 'prosemirror-model';
import { Plugin, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { schema } from '../schema';

const { raw } = schema.marks;

const isRaw = (node: Node) => !!raw.isInSet(node.marks);

/**
 * The range of the inline mdx starting at or containing the text after `pos`, `null` outside of inline mdx.
 */
export const rawRangeAt = (doc: Node, pos: number): { from: number; to: number } | null => {
    const $pos = doc.resolve(pos);
    const { parent } = $pos;
    const index = $pos.index();
    if (index >= parent.childCount || !isRaw(parent.child(index))) {
        return null;
    }
    let start = index;
    while (start > 0 && isRaw(parent.child(start - 1))) {
        start--;
    }
    let end = index + 1;
    while (end < parent.childCount && isRaw(parent.child(end))) {
        end++;
    }
    return { from: $pos.posAtIndex(start), to: $pos.posAtIndex(end) };
};

/** a wrapped element has its left border only on its first line */
const isOnLeftBorder = (element: HTMLElement, event: MouseEvent) => {
    const firstLine = element.getClientRects()[0];
    if (!firstLine) {
        return false;
    }
    const borderWidth = parseFloat(getComputedStyle(element).borderLeftWidth);
    const isOnFirstLine = event.clientY >= firstLine.top && event.clientY <= firstLine.bottom;
    return isOnFirstLine && event.clientX - firstLine.left < borderWidth;
};

const selectRawOnBorder = (view: EditorView, event: MouseEvent) => {
    const element = (event.target as HTMLElement).closest('code.cms-raw-inline');
    if (event.button !== 0 || !(element instanceof HTMLElement) || !isOnLeftBorder(element, event)) {
        return false;
    }
    const range = rawRangeAt(view.state.doc, view.posAtDOM(element, 0));
    if (!range) {
        return false;
    }
    // otherwise the browser places the cursor at the click
    event.preventDefault();
    const { tr, doc } = view.state;
    view.dispatch(tr.setSelection(TextSelection.create(doc, range.from, range.to)));
    view.focus();
    return true;
};

/**
 * A click on the left border of inline mdx selects all of it, e.g. to drag it to another place
 * (ProseMirror moves a dragged selection), to copy or to delete it.
 */
export const rawSelection = () => {
    return new Plugin({ props: { handleDOMEvents: { mousedown: selectRawOnBorder } } });
};
