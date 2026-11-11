import { mdiDragVertical } from '@mdi/js';
import type { Node, Slice } from 'prosemirror-model';
import { NodeSelection, Plugin, type PluginView } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { schema } from '../schema';

const { nodes } = schema;

/**
 * Drags `node` like ProseMirror's own `dragstart` handler: on drop, ProseMirror removes `node`, or else
 * the selection. Selecting the block is not reliable: e.g. CodeMirror moves the selection into the code
 * block when it gets the focus, and the block would be copied instead of moved.
 *
 * `node` is internal to ProseMirror (`Dragging` in prosemirror-view/src/input.ts, checked with 1.42.9):
 * after updating prosemirror-view, check that a dragged code block is still moved and not copied.
 */
const startDragging = (view: EditorView, slice: Slice, node: NodeSelection) => {
    const dragging: EditorView['dragging'] & { node: NodeSelection } = { slice, move: true, node };
    view.dragging = dragging;
};

/** blocks inside these nodes can be moved, e.g. a paragraph inside an admonition */
const CONTAINERS = new Set([
    nodes.doc,
    nodes.blockquote,
    nodes.container_directive,
    nodes.items_directive,
    nodes.directive_item,
    nodes.jsx_flow,
    nodes.footnote_definition
]);
/** must stay the first child of their parent */
const NOT_DRAGGABLE = new Set([nodes.frontmatter, nodes.directive_label]);

const isDraggable = (node: Node, parent: Node) => {
    if (NOT_DRAGGABLE.has(node.type)) {
        return false;
    }
    return node.type === nodes.list_item || (node.isBlock && CONTAINERS.has(parent.type));
};

interface Block {
    pos: number;
    dom: HTMLElement;
}

/**
 * The innermost draggable block at the given coordinates.
 */
const blockAt = (view: EditorView, left: number, top: number): Block | undefined => {
    const coords = view.posAtCoords({ left, top });
    if (!coords) {
        return undefined;
    }
    const { doc } = view.state;
    const candidates: number[] = [];
    if (coords.inside >= 0) {
        candidates.push(coords.inside);
    }
    const $pos = doc.resolve(coords.pos);
    for (let depth = $pos.depth; depth > 0; depth--) {
        candidates.push($pos.before(depth));
    }
    for (const pos of candidates) {
        const $block = doc.resolve(pos);
        const node = $block.nodeAfter;
        const dom = view.nodeDOM(pos);
        if (node && dom instanceof HTMLElement && isDraggable(node, $block.parent)) {
            return { pos, dom };
        }
    }
    return undefined;
};

const createHandle = () => {
    const handle = document.createElement('div');
    handle.className = 'cms-drag-handle';
    handle.draggable = true;
    handle.title = 'Ziehen, um den Block zu verschieben';
    handle.innerHTML = `<svg viewBox="0 0 24 24"><path d="${mdiDragVertical}" /></svg>`;
    return handle;
};

/**
 * Shows a grab handle left of the hovered block. Dragging the handle moves the block,
 * using the drag and drop handling of ProseMirror (drop cursor, undo).
 */
class DragHandleView implements PluginView {
    private readonly view: EditorView;
    private readonly handle = createHandle();
    private block: Block | undefined;

    constructor(view: EditorView) {
        this.view = view;
        const container = view.dom.parentElement!;
        container.appendChild(this.handle);
        container.addEventListener('mousemove', this.handleMouseMove);
        container.addEventListener('mouseleave', this.hide);
        this.handle.addEventListener('dragstart', this.handleDragStart);
        this.handle.addEventListener('dragend', this.handleDragEnd);
    }

    update(view: EditorView, previous: { doc: Node }) {
        if (!view.state.doc.eq(previous.doc)) {
            this.hide();
        }
    }

    destroy() {
        const container = this.handle.parentElement;
        container?.removeEventListener('mousemove', this.handleMouseMove);
        container?.removeEventListener('mouseleave', this.hide);
        this.handle.remove();
    }

    private handleMouseMove = (event: MouseEvent) => {
        if (this.handle.contains(event.target as HTMLElement) || this.isInGutter(event)) {
            return;
        }
        const block = blockAt(this.view, event.clientX, event.clientY);
        if (!block) {
            return this.hide();
        }
        this.show(block);
    };

    /**
     * Whether the pointer is between the handle and the content of the current block.
     * On its way to the handle of a nested block, the pointer crosses the padding of the
     * parent block, which must not move the handle to the parent block.
     */
    private isInGutter(event: MouseEvent) {
        if (!this.block) {
            return false;
        }
        const block = this.block.dom.getBoundingClientRect();
        const handle = this.handle.getBoundingClientRect();
        const isBesideBlock =
            event.clientY >= Math.min(block.top, handle.top) && event.clientY <= block.bottom;
        return isBesideBlock && event.clientX >= handle.left && event.clientX < block.left;
    }

    private show(block: Block) {
        this.block = block;
        const container = this.handle.parentElement!.getBoundingClientRect();
        const rect = block.dom.getBoundingClientRect();
        // list items are aligned with their list, so the handle does not cover the bullet
        const left =
            block.dom.tagName === 'LI' ? block.dom.parentElement!.getBoundingClientRect().left : rect.left;
        const lineHeight = parseFloat(getComputedStyle(block.dom).lineHeight) || 24;
        this.handle.style.top = `${rect.top - container.top + Math.min(lineHeight, rect.height) / 2}px`;
        this.handle.style.left = `${left - container.left}px`;
        this.handle.classList.add('cms-drag-handle--visible');
    }

    private hide = () => {
        this.block = undefined;
        this.handle.classList.remove('cms-drag-handle--visible');
    };

    private handleDragStart = (event: DragEvent) => {
        const pos = this.block?.pos;
        if (pos === undefined || !event.dataTransfer) {
            return;
        }
        const { view } = this;
        const node = NodeSelection.create(view.state.doc, pos);
        const slice = node.content();
        const { dom, text } = view.serializeForClipboard(slice);
        event.dataTransfer.clearData();
        event.dataTransfer.setData('text/html', dom.innerHTML);
        event.dataTransfer.setData('text/plain', text);
        event.dataTransfer.effectAllowed = 'copyMove';
        event.dataTransfer.setDragImage(this.block!.dom, 0, 0);
        startDragging(view, slice, node);
    };

    private handleDragEnd = () => {
        this.view.dragging = null;
        this.hide();
    };
}

export const dragHandle = () => new Plugin({ view: (view) => new DragHandleView(view) });
