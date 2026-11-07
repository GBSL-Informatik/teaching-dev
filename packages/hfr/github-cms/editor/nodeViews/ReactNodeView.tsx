import { action, observable, observableRef } from 'mobx';
import type { Attrs, Node } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';
import type { EditorView, NodeView, NodeViewConstructor, ViewMutationRecord } from 'prosemirror-view';
import React from 'react';
import { createPortal } from 'react-dom';
import type MdxDocument from '../models/MdxDocument';

/**
 * The interface between a ProseMirror node view and its React component.
 * The component observes `node` and `selected`, and changes the node through the helper methods.
 */
export class NodeViewHandle {
    @observableRef accessor node: Node;
    @observable accessor selected = false;

    constructor(
        node: Node,
        readonly document: MdxDocument,
        private readonly getPos: () => number | undefined
    ) {
        this.node = node;
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
        const { state, dispatch } = this.document;
        dispatch(state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs }));
    }

    replaceWith(node: Node) {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.document;
        dispatch(state.tr.replaceWith(pos, pos + this.node.nodeSize, node));
    }

    remove() {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.document;
        dispatch(state.tr.delete(pos, pos + this.node.nodeSize));
        this.document.view?.focus();
    }

    select() {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.document;
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

    constructor(
        node: Node,
        getPos: () => number | undefined,
        document: MdxDocument,
        private readonly options: Options
    ) {
        const tag = node.isInline ? 'span' : 'div';
        this.handle = new NodeViewHandle(node, document, getPos);
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
        document.addPortal(
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

    private updateClassName(node: Node) {
        const selected = this.handle.selected ? 'ProseMirror-selectednode' : '';
        this.dom.className = `cms-node-view ${this.options.className?.(node) ?? ''} ${selected}`;
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
        return !!target.closest('input, textarea, select, button, [data-stop-event]');
    }

    ignoreMutation(mutation: ViewMutationRecord) {
        if (mutation.type === 'selection') {
            return false;
        }
        return !this.contentDOM?.contains(mutation.target);
    }

    destroy() {
        this.handle.document.removePortal(this.portalKey);
    }
}

export const reactNodeView = (document: MdxDocument, options: Options): NodeViewConstructor => {
    return (node: Node, _view: EditorView, getPos: () => number | undefined) =>
        new ReactNodeView(node, getPos, document, options);
};
