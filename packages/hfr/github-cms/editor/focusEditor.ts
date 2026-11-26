import type { EditorView } from 'prosemirror-view';

/**
 * Focuses ProseMirror, keeping its selection. `view.focus()` focuses the editor before it sets the browser
 * selection: when the browser selection is outside of the editor (e.g. in a popover), the browser places
 * the caret at the start of the editor, and the first code block (e.g. the frontmatter) takes the focus.
 */
export const focusEditor = (view: EditorView) => {
    if (view.hasFocus()) {
        return;
    }
    const { node, offset } = view.domAtPos(view.state.selection.from);
    window.getSelection()?.collapse(node, offset);
    view.focus();
};
