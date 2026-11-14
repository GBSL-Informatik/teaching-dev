import { action, autorun, type IReactionDisposer, observable, observableRef } from 'mobx';
import type { Attrs, Node } from 'prosemirror-model';
import { type EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView, NodeView, NodeViewConstructor, ViewMutationRecord } from 'prosemirror-view';
import React, { type ReactPortal } from 'react';
import { createPortal } from 'react-dom';

/**
 * Focuses ProseMirror, keeping its selection. `view.focus()` focuses the editor before it sets the browser
 * selection: when the browser selection is outside of the editor (e.g. in a popover), the browser places
 * the caret at the start of the editor, and the first code block (e.g. the frontmatter) takes the focus.
 */
const focusEditor = (view: EditorView) => {
    if (view.hasFocus()) {
        return;
    }
    const { node, offset } = view.domAtPos(view.state.selection.from);
    window.getSelection()?.collapse(node, offset);
    view.focus();
};

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
    /** the child shown of all tab items in the content, e.g. the active tab of `<Tabs>` */
    @observable accessor activeChild: number | null = null;
    /** e.g. while a preview is shown in place of the content */
    @observable accessor isContentHidden = false;
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

    @action
    setActiveChild(index: number | null) {
        this.activeChild = index;
    }

    @action
    setContentHidden(isHidden: boolean) {
        this.isContentHidden = isHidden;
    }

    /** whether the node is selected or the selection is within its content, e.g. the cursor */
    containsSelection() {
        const pos = this.getPos();
        if (pos === undefined) {
            return false;
        }
        const { from, to } = this.editor.state.selection;
        return from >= pos && to <= pos + this.node.nodeSize;
    }

    /** the index of the child containing the selection, `null` when it is outside of the content */
    childIndexOfSelection() {
        const pos = this.getPos();
        if (pos === undefined) {
            return null;
        }
        const { from } = this.editor.state.selection;
        let found: number | null = null;
        this.node.forEach((child, offset, index) => {
            const start = pos + 1 + offset;
            if (from >= start && from < start + child.nodeSize) {
                found = index;
            }
        });
        return found;
    }

    updateAttrs(attrs: Attrs) {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs }));
    }

    /** inserts the node at the start of the content of this node, e.g. the label of a directive */
    prependChild(node: Node) {
        const pos = this.getPos();
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.insert(pos + 1, node));
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

    updateChildAttrs(index: number, attrs: Attrs) {
        const childPos = this.childPos(index);
        if (childPos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        const child = this.node.child(index);
        dispatch(state.tr.setNodeMarkup(childPos, undefined, { ...child.attrs, ...attrs }));
    }

    /** places the cursor at the start of the child, e.g. to show a tab */
    focusChild(index: number) {
        const childPos = this.childPos(index);
        if (childPos === undefined) {
            return;
        }
        const { state, dispatch } = this.editor;
        dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(childPos + 1))));
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

    /**
     * Selects the node and moves the focus to ProseMirror, e.g. away from a code block edited before,
     * so that copying or cutting applies to the selected node.
     */
    selectAndFocus() {
        this.select();
        if (this.editor.view) {
            focusEditor(this.editor.view);
        }
    }

    private childPos(index: number) {
        const pos = this.getPos();
        if (pos === undefined || index >= this.node.childCount) {
            return undefined;
        }
        let childPos = pos + 1;
        for (let i = 0; i < index; i++) {
            childPos += this.node.child(i).nodeSize;
        }
        return childPos;
    }
}

export interface NodeViewProps {
    handle: NodeViewHandle;
}

/** css properties in camel case (`flexBasis`) or custom properties (`--name`) */
export type NodeStyle = Record<string, string>;

interface Options {
    component: React.ComponentType<NodeViewProps>;
    /** whether the node has editable content (rendered after the component) */
    hasContent?: boolean;
    className?: (node: Node) => string;
    /** inline styles computed from the attributes, e.g. the layout set in markdown */
    style?: (node: Node) => NodeStyle;
    /** class names and inline styles of the element holding the editable content */
    content?: (node: Node) => { className?: string; style?: NodeStyle };
}

const applyStyle = (element: HTMLElement, style: NodeStyle = {}) => {
    element.removeAttribute('style');
    for (const [property, value] of Object.entries(style)) {
        const name = property.startsWith('--')
            ? property
            : property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        element.style.setProperty(name, value);
    }
};

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
    private readonly disposeContentAttributes?: IReactionDisposer;

    constructor(node: Node, getPos: () => number | undefined, editor: NodeViewEditor, options: Options) {
        this.options = options;
        const tag = node.isInline ? 'span' : 'div';
        this.handle = new NodeViewHandle(node, editor, getPos);
        this.dom = window.document.createElement(tag);
        this.component = window.document.createElement(tag);
        this.component.className = 'cms-node-view-component';
        this.component.contentEditable = 'false';
        this.dom.appendChild(this.component);
        if (options.hasContent) {
            this.contentDOM = window.document.createElement('div');
            this.dom.appendChild(this.contentDOM);
            this.disposeContentAttributes = autorun(() => this.updateContentAttributes());
        }
        this.updateDom(node);
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
        this.updateDom(node);
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
        // e.g. `data-active-child`, `hidden`: attributes of the content element are no document changes
        if (mutation.type === 'attributes' && mutation.target === this.contentDOM) {
            return true;
        }
        return !this.contentDOM?.contains(mutation.target);
    }

    destroy() {
        this.disposeContentAttributes?.();
        this.handle.editor.removePortal(this.portalKey);
    }

    private updateContentAttributes() {
        const { activeChild, isContentHidden } = this.handle;
        this.contentDOM!.hidden = isContentHidden;
        // the other tab items are hidden by css, see `Editor/styles.module.scss`
        if (activeChild === null) {
            this.contentDOM!.removeAttribute('data-active-child');
            return;
        }
        this.contentDOM!.setAttribute('data-active-child', String(activeChild));
    }

    private updateDom(node: Node) {
        const selected = this.handle.selected ? 'ProseMirror-selectednode' : '';
        this.dom.className = `cms-node-view ${this.options.className?.(node) ?? ''} ${selected}`;
        applyStyle(this.dom, this.options.style?.(node));
        if (this.contentDOM) {
            const content = this.options.content?.(node);
            this.contentDOM.className = `cms-node-view-content ${content?.className ?? ''}`;
            applyStyle(this.contentDOM, content?.style);
        }
    }
}

export const reactNodeView = (editor: NodeViewEditor, options: Options): NodeViewConstructor => {
    return (node: Node, _view: EditorView, getPos: () => number | undefined) =>
        new ReactNodeView(node, getPos, editor, options);
};
