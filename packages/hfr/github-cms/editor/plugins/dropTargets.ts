import { Plugin, type PluginView } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/** set on the parent of the editor while ProseMirror drags a part of the document */
const DRAGGING_CLASS = 'cms-dragging';

/**
 * Code editors and inputs in node views must not take the drop of a dragged part of the document:
 * they would insert its text, the dragged part would be copied instead of moved.
 * While dragging, their pointer events are disabled (see `Editor/styles.module.scss`),
 * so the drop goes to the node view around them, which leaves it to ProseMirror.
 */
class DropTargetsView implements PluginView {
    private readonly view: EditorView;

    constructor(view: EditorView) {
        this.view = view;
        document.addEventListener('dragstart', this.handleDragStart);
        // capturing: the dragged node may already be removed from the document on `dragend`
        document.addEventListener('drop', this.handleDragEnd, true);
        document.addEventListener('dragend', this.handleDragEnd, true);
    }

    destroy() {
        document.removeEventListener('dragstart', this.handleDragStart);
        document.removeEventListener('drop', this.handleDragEnd, true);
        document.removeEventListener('dragend', this.handleDragEnd, true);
        this.handleDragEnd();
    }

    // bubbling: ProseMirror and the drag handle set `view.dragging` before
    private handleDragStart = () => {
        this.view.dom.parentElement?.classList.toggle(DRAGGING_CLASS, !!this.view.dragging);
    };

    private handleDragEnd = () => {
        this.view.dom.parentElement?.classList.remove(DRAGGING_CLASS);
    };
}

export const dropTargets = () => new Plugin({ view: (view) => new DropTargetsView(view) });
