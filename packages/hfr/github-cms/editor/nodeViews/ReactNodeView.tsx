import { action, observable, observableRef } from 'mobx';
import type { Attrs, Node } from 'prosemirror-model';
import { type EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView, NodeView, NodeViewConstructor, ViewMutationRecord } from 'prosemirror-view';
import React, { type ReactPortal } from 'react';
import { createPortal } from 'react-dom';

/**
 * The editor of a node view: the document or a nested editor, e.g. of an image caption.
 * The React content of all node views is rendered as portals by the document.
 */
export interface NodeViewEditor {
    readonly state: EditorState;
    readonly view: EditorView | null;
    dispatch(tr: Transaction): void;
    addPortal(key: string, portal: ReactPortal): void;
    removePortal(key: string): void;
}

/**
 * The interface between a ProseMirror node view and its React component.
 * The component observes `node` and `selected`, and changes the node through the helper methods.
 */
export class NodeViewHandle {
    @observableRef accessor node: Node;
    @observable accessor selected = false;
    readonly editor: NodeViewEditor;
    private readonly getPos: () => number | undefined;

    constructor(node: Node, editor: NodeViewEditor, getPos: () => number | undefined) {
        this.node = node;
        this.editor = editor;
        this.getPos = getPos;
    }

    get pos() {
        return this.getPos();
    }

    @action
    setNode(node: Node) {
        this.node = node;
    }

    @action
    setSelected(selected: boolean) {
        this.selected = selected;
    }

    updateAttrs(attrs: Attrs) {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs }));
    }

    /**
     * Replaces this node and places the cursor at the start of the new node.
     */
    replaceWith(node: Node) {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        const tr = state.tr.replaceWith(pos, pos + this.node.nodeSize, node);
        dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1))));
        this.editor.view?.focus();
    }

    remove() {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.delete(pos, pos + this.node.nodeSize));
        this.editor.view?.focus();
    }

    select() {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    }
}

export interface NodeViewProps {
    handle: NodeViewHandle;
}

interface Options {
    component: React.ComponentType<NodeViewProps>;
    /** whether the node has editable content (rendered after the component) */
    hasContent?: boolean;
    className?: (node: Node) => string;
}

let portalCounter = 0;

/**
 * Renders a React component for a node. The component is rendered as a portal into a
 * non-editable element. Editable content is rendered by ProseMirror into a separate
 * element after it, so React never touches the DOM managed by ProseMirror.
 */
class ReactNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM?: HTMLElement;
    private readonly component: HTMLElement;
    private readonly handle: NodeViewHandle;
    private readonly portalKey = `node-view-${portalCounter++}`;
    private readonly options: Options;

    constructor(node: Node, getPos: () => number | undefined, editor: NodeViewEditor, options: Options) {
        this.options = options;
        const tag = node.isInline ? 'span' : 'div';
        this.handle = new NodeViewHandle(node, editor, getPos);
        this.dom = window.document.createElement(tag);
        this.updateClassName(node);
        this.component = window.document.createElement(tag);
        this.component.contentEditable = 'false';
        this.dom.appendChild(this.component);
        if (options.hasContent) {
            this.contentDOM = window.document.createElement('div');
            this.contentDOM.className = 'cms-node-view-content';
            this.dom.appendChild(this.contentDOM);
        }
        const Component = options.component;
        editor.addPortal(
            this.portalKey,
            createPortal(<Component handle={this.handle} />, this.component, this.portalKey)
        );
    }

    update(node: Node) {
        if (node.type !== this.handle.node.type) {
            return false;
        }
        this.handle.setNode(node);
        this.updateClassName(node);
        return true;
    }

    selectNode() {
        this.handle.setSelected(true);
        this.dom.classList.add('ProseMirror-selectednode');
    }

    deselectNode() {
        this.handle.setSelected(false);
        this.dom.classList.remove('ProseMirror-selectednode');
    }

    /**
     * Interactive elements of the component handle their events themselves,
     * other events (e.g. clicking to select the node or dragging it) are handled by ProseMirror.
     */
    stopEvent(event: Event) {
        const target = event.target as HTMLElement | null;
        if (!target || !this.component.contains(target)) {
            return false;
        }
        // node views can be nested, e.g. icons in the caption editor of an image
        const interactive = target.closest('input, textarea, select, button, [data-stop-event]');
        return !!interactive && this.component.contains(interactive);
    }

    ignoreMutation(mutation: ViewMutationRecord) {
        if (mutation.type === 'selection') {
            return false;
        }
        return !this.contentDOM?.contains(mutation.target);
    }

    destroy() {
        this.handle.editor.removePortal(this.portalKey);
    }

    private updateClassName(node: Node) {
        const selected = this.handle.selected ? 'ProseMirror-selectednode' : '';
        this.dom.className = `cms-node-view ${this.options.className?.(node) ?? ''} ${selected}`;
    }
}

export const reactNodeView = (editor: NodeViewEditor, options: Options): NodeViewConstructor => {
    return (node: Node, _view: EditorView, getPos: () => number | undefined) =>
        new ReactNodeView(node, getPos, editor, options);
};
