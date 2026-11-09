import { lift, setBlockType, wrapIn } from 'prosemirror-commands';
import { type Attrs, Fragment, type Node, type NodeType } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { type Command, type EditorState, TextSelection } from 'prosemirror-state';
import { findTable, selectedRect, TableMap } from 'prosemirror-tables';
import { schema } from './schema';

const { nodes, marks } = schema;

export type BlockType = 'paragraph' | 'code_block' | `heading${1 | 2 | 3 | 4 | 5 | 6}`;

/** the type of the textblock at the cursor */
export const currentBlockType = (state: EditorState): BlockType | undefined => {
    const { parent } = state.selection.$from;
    if (parent.type === nodes.heading) {
        return `heading${parent.attrs.level}` as BlockType;
    }
    if (parent.type === nodes.paragraph || parent.type === nodes.code_block) {
        return parent.type.name as BlockType;
    }
    return undefined;
};

export const setCurrentBlockType = (type: BlockType): Command => {
    if (type.startsWith('heading')) {
        return setBlockType(nodes.heading, { level: Number(type.slice('heading'.length)) });
    }
    return setBlockType(nodes[type as 'paragraph' | 'code_block']);
};

/**
 * Inserts block nodes after the block at the cursor, within the innermost container
 * accepting them (e.g. inside a directive), and places the cursor inside the first inserted node.
 * An empty paragraph at the cursor is replaced.
 */
export const insertBlock = (content: Node | Node[]): Command => {
    return (state, dispatch) => {
        const fragment = Fragment.from(content);
        const { $from } = state.selection;
        const isEmptyParagraph = $from.parent.type === nodes.paragraph && $from.parent.content.size === 0;
        for (let depth = $from.depth; depth > 0; depth--) {
            const container = $from.node(depth - 1);
            const index = $from.index(depth - 1);
            const replaceCurrent = isEmptyParagraph && depth === $from.depth;
            const [from, to] = replaceCurrent ? [index, index + 1] : [index + 1, index + 1];
            if (!container.canReplace(from, to, fragment)) {
                continue;
            }
            if (dispatch) {
                const pos = replaceCurrent ? $from.before(depth) : $from.after(depth);
                const end = replaceCurrent ? $from.after(depth) : pos;
                const tr = state.tr.replaceWith(pos, end, fragment);
                dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1))).scrollIntoView());
            }
            return true;
        }
        return false;
    };
};

export const insertText = (text: string): Command => {
    return (state, dispatch) => {
        dispatch?.(state.tr.insertText(text));
        return true;
    };
};

const canContainInline = (parent: Node) => parent.inlineContent && !parent.type.spec.code;

export const insertInline = (node: Node): Command => {
    return (state, dispatch) => {
        if (!canContainInline(state.selection.$from.parent)) {
            return false;
        }
        dispatch?.(state.tr.replaceSelectionWith(node).scrollIntoView());
        return true;
    };
};

/** inserts the node at the text position nearest to `pos`, e.g. where an image is dropped */
export const insertInlineAt = (pos: number, node: Node): Command => {
    return (state, dispatch) => {
        const $pos = state.doc.resolve(Math.min(pos, state.doc.content.size));
        const tr = state.tr.setSelection(TextSelection.near($pos));
        if (!canContainInline(tr.selection.$from.parent)) {
            return false;
        }
        dispatch?.(tr.replaceSelectionWith(node).scrollIntoView());
        return true;
    };
};

/**
 * Wraps the selection in a list of the given type, or lifts it out of the list.
 */
export const toggleList = (listType: NodeType): Command => {
    return (state, dispatch, view) => {
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type === listType) {
                return liftListItem(nodes.list_item)(state, dispatch, view);
            }
            if (node.type === nodes.bullet_list || node.type === nodes.ordered_list) {
                dispatch?.(state.tr.setNodeMarkup($from.before(depth), listType));
                return true;
            }
        }
        return wrapInList(listType)(state, dispatch, view);
    };
};

export const toggleBlockquote: Command = (state, dispatch, view) => {
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type === nodes.blockquote) {
            return lift(state, dispatch, view);
        }
    }
    return wrapIn(nodes.blockquote)(state, dispatch, view);
};

export const setLink = (href: string): Command => {
    return (state, dispatch) => {
        const { from, to, empty } = state.selection;
        if (empty) {
            const text = schema.text(href, [marks.link.create({ href })]);
            dispatch?.(state.tr.replaceSelectionWith(text, false));
            return true;
        }
        dispatch?.(state.tr.removeMark(from, to, marks.link).addMark(from, to, marks.link.create({ href })));
        return true;
    };
};

export const removeLink: Command = (state, dispatch) => {
    const { $from, from, to, empty } = state.selection;
    if (!empty) {
        dispatch?.(state.tr.removeMark(from, to, marks.link));
        return true;
    }
    // remove the link around the cursor
    const { parent, parentOffset } = $from;
    const child = parent.childBefore(parentOffset);
    if (!child.node || !marks.link.isInSet(child.node.marks)) {
        return false;
    }
    const start = $from.start() + child.offset;
    dispatch?.(state.tr.removeMark(start, start + child.node.nodeSize, marks.link));
    return true;
};

export const createTable = (rows: number, columns: number) => {
    const row = (cellType: NodeType) =>
        nodes.table_row.create(
            null,
            Array.from({ length: columns }, () => cellType.create())
        );
    return nodes.table.create(null, [
        row(nodes.table_header),
        ...Array.from({ length: rows - 1 }, () => row(nodes.table_cell))
    ]);
};

/**
 * Markdown tables only support an alignment per column, so it is set on all cells of the column.
 */
export const setColumnAlign = (align: 'left' | 'center' | 'right' | null): Command => {
    return (state, dispatch) => {
        const table = findTable(state.selection.$from);
        if (!table) {
            return false;
        }
        if (!dispatch) {
            return true;
        }
        const { left } = selectedRect(state);
        const map = TableMap.get(table.node);
        const tr = state.tr;
        map.cellsInRect({ left, right: left + 1, top: 0, bottom: map.height }).forEach((cellPos) => {
            const cell = table.node.nodeAt(cellPos);
            tr.setNodeMarkup(table.start + cellPos, undefined, { ...cell?.attrs, align });
        });
        dispatch(tr);
        return true;
    };
};

export const hasFrontmatter = (state: EditorState) => state.doc.firstChild?.type === nodes.frontmatter;

export const insertFrontmatter: Command = (state, dispatch) => {
    if (hasFrontmatter(state)) {
        return false;
    }
    const frontmatter = nodes.frontmatter.create(null, schema.text('title: Titel'));
    dispatch?.(state.tr.insert(0, frontmatter));
    return true;
};

export const createNode = (type: NodeType, attrs: Attrs | null, content?: Node | Node[]) => {
    return type.createAndFill(attrs, content)!;
};
