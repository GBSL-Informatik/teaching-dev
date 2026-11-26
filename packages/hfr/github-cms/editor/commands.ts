import { lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import {
    type Attrs,
    Fragment,
    type Mark,
    type MarkType,
    type Node,
    type NodeRange,
    type NodeType,
    type ResolvedPos
} from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { type Command, type EditorState, Selection, TextSelection } from 'prosemirror-state';
import { findTable, selectedRect, TableMap } from 'prosemirror-tables';
import { liftTarget } from 'prosemirror-transform';
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

/** the spaces and tabs directly before and after the cursor, within its textblock */
const spacesAroundCursor = (state: EditorState) => {
    const { $from, empty } = state.selection;
    if (!empty || !$from.parent.isTextblock) {
        return null;
    }
    const { parent, parentOffset, pos } = $from;
    // inline nodes count as one character, as in the positions
    const before = parent.textBetween(0, parentOffset, undefined, '\ufffc');
    const after = parent.textBetween(parentOffset, parent.content.size, undefined, '\ufffc');
    const spacesBefore = before.match(/[ \t]*$/)![0].length;
    const spacesAfter = after.match(/^[ \t]*/)![0].length;
    if (spacesBefore + spacesAfter === 0) {
        return null;
    }
    return { from: pos - spacesBefore, to: pos + spacesAfter };
};

/**
 * Runs a command splitting the textblock at the cursor (e.g. Enter) without the spaces at the
 * cursor: at the start or end of a paragraph, markdown would escape them (`&#x20;`).
 */
export const withoutSpacesAtCursor = (split: Command): Command => {
    return (state, dispatch, view) => {
        const spaces = spacesAroundCursor(state);
        if (!spaces) {
            return split(state, dispatch, view);
        }
        const tr = state.tr.delete(spaces.from, spaces.to);
        return split(state.apply(tr), (splitTr) => {
            splitTr.steps.forEach((step) => tr.step(step));
            tr.setSelection(Selection.fromJSON(tr.doc, splitTr.selection.toJSON()));
            if (splitTr.storedMarks) {
                tr.setStoredMarks(splitTr.storedMarks);
            }
            dispatch?.(tr.scrollIntoView());
        });
    };
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

/**
 * Types `:mdi[`, which opens the icon suggestions, see `iconSource`.
 * After a word, a space is typed first: `Wort:mdi[` would be text, not a directive.
 */
export const startIcon: Command = (state, dispatch) => {
    const { $from } = state.selection;
    if (!canContainInline($from.parent)) {
        return false;
    }
    const before = $from.nodeBefore;
    const isAfterWhitespace = !before || (before.isText && /\s$/.test(before.text!));
    dispatch?.(state.tr.insertText(isAfterWhitespace ? ':mdi[' : ' :mdi[').scrollIntoView());
    return true;
};

export const insertInline = (node: Node): Command => {
    return (state, dispatch) => {
        if (!canContainInline(state.selection.$from.parent)) {
            return false;
        }
        dispatch?.(state.tr.replaceSelectionWith(node).scrollIntoView());
        return true;
    };
};

const INLINE_MDX_PLACEHOLDER = 'Text';
const NEW_INLINE_MDX = `<span>${INLINE_MDX_PLACEHOLDER}</span>`;

/**
 * Inserts `<span>Text</span>` as inline mdx, with `Text` selected to be replaced.
 * Not with `insertInline`: it would replace the `raw` mark by the marks at the cursor.
 */
export const insertInlineMdx: Command = (state, dispatch) => {
    if (!canContainInline(state.selection.$from.parent)) {
        return false;
    }
    const { from } = state.selection;
    const placeholderStart = from + NEW_INLINE_MDX.indexOf(INLINE_MDX_PLACEHOLDER);
    const placeholderEnd = placeholderStart + INLINE_MDX_PLACEHOLDER.length;
    const tr = state.tr
        .insertText(NEW_INLINE_MDX)
        .addMark(from, from + NEW_INLINE_MDX.length, marks.raw.create());
    dispatch?.(
        tr.setSelection(TextSelection.create(tr.doc, placeholderStart, placeholderEnd)).scrollIntoView()
    );
    return true;
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

const isBlockquote = (node: Node) => node.type === nodes.blockquote;

/** moves the blocks of the range out of their quote, the quote is split around them */
const liftRange = (range: NodeRange | null): Command => {
    return (state, dispatch) => {
        if (!range) {
            return false;
        }
        const target = liftTarget(range);
        if (target === null) {
            return false;
        }
        dispatch?.(state.tr.lift(range, target).scrollIntoView());
        return true;
    };
};

/** moves the block at the cursor out of the quote around it, e.g. a whole list */
export const liftOutOfBlockquote: Command = (state, dispatch) => {
    const { $from, $to } = state.selection;
    return liftRange($from.blockRange($to, isBlockquote))(state, dispatch);
};

/** moves the block at the position, e.g. a list, out of the quote it is a child of */
export const liftOutOfBlockquoteAt = (pos: number): Command => {
    return (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (!node) {
            return false;
        }
        const $start = state.doc.resolve(pos);
        const range = $start.blockRange(state.doc.resolve(pos + node.nodeSize), isBlockquote);
        return liftRange(range)(state, dispatch);
    };
};

/** outdents a list item nested in another list item, top level items are not changed */
export const liftNestedListItem: Command = (state, dispatch, view) => {
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 2; depth--) {
        if ($from.node(depth).type === nodes.list_item) {
            const isNested = $from.node(depth - 2).type === nodes.list_item;
            return isNested && liftListItem(nodes.list_item)(state, dispatch, view);
        }
    }
    return false;
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

const WORD_BEFORE = /[\p{L}\p{N}_]*$/u;
const WORD_AFTER = /^[\p{L}\p{N}_]*/u;

/** the word at the cursor, when the cursor is inside the word or at its start or end */
const wordAtCursor = (state: EditorState) => {
    const { $from, empty } = state.selection;
    if (!empty || !$from.parent.isTextblock) {
        return null;
    }
    const { parent, parentOffset, pos } = $from;
    // inline nodes count as one character, as in the positions
    const before = parent.textBetween(0, parentOffset, undefined, '\ufffc');
    const after = parent.textBetween(parentOffset, parent.content.size, undefined, '\ufffc');
    const lengthBefore = before.match(WORD_BEFORE)![0].length;
    const lengthAfter = after.match(WORD_AFTER)![0].length;
    if (lengthBefore + lengthAfter === 0) {
        return null;
    }
    return { from: pos - lengthBefore, to: pos + lengthAfter };
};

/**
 * Like `toggleMark`, but without a selection, the mark is toggled on the word at the cursor.
 */
export const toggleMarkOnWord = (markType: MarkType): Command => {
    const toggle = toggleMark(markType);
    return (state, dispatch, view) => {
        const word = wordAtCursor(state);
        if (!word || !state.selection.$from.parent.type.allowsMarkType(markType)) {
            return toggle(state, dispatch, view);
        }
        if (dispatch) {
            const { from, to } = word;
            const tr = state.doc.rangeHasMark(from, to, markType)
                ? state.tr.removeMark(from, to, markType)
                : state.tr.addMark(from, to, markType.create());
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
};

export interface LinkRange {
    from: number;
    to: number;
    /** the attributes of the link mark, `href` and `title` */
    attrs: Attrs;
}

/**
 * The link to edit: the selected range with the attributes of its first link,
 * or the whole link around the cursor, also with the cursor at the start or the end of the link.
 */
export const linkAtSelection = (state: EditorState): LinkRange | null => {
    const { $from, from, to, empty } = state.selection;
    if (!empty) {
        const link = firstLinkBetween(state.doc, from, to);
        return link ? { from, to, attrs: link.attrs } : null;
    }
    const link = linkTouching($from);
    if (!link) {
        return null;
    }
    return { ...markRangeAround($from, link), attrs: link.attrs };
};

/**
 * Links the selection, or changes the href of the link around the cursor, keeping its title.
 * Without a selection and outside a link, the href is inserted as link text.
 */
export const setLink = (href: string): Command => {
    return (state, dispatch) => {
        const { selection } = state;
        const link = linkAtSelection(state);
        if (!link && selection.empty) {
            const text = schema.text(href, [marks.link.create({ href })]);
            dispatch?.(state.tr.replaceSelectionWith(text, false));
            return true;
        }
        const { from, to } = link ?? selection;
        const mark = marks.link.create({ ...link?.attrs, href });
        dispatch?.(state.tr.removeMark(from, to, marks.link).addMark(from, to, mark));
        return true;
    };
};

export const removeLink: Command = (state, dispatch) => {
    const link = linkAtSelection(state);
    if (!link) {
        return false;
    }
    dispatch?.(state.tr.removeMark(link.from, link.to, marks.link));
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

export const paragraph = (text?: string) => nodes.paragraph.create(null, text ? schema.text(text) : null);

export const createNode = (type: NodeType, attrs: Attrs | null, content?: Node | Node[]) => {
    return type.createAndFill(attrs, content)!;
};

/** the link the position is in or at an edge of, the link before wins between two links */
const linkTouching = ($pos: ResolvedPos) => {
    const { nodeBefore, nodeAfter } = $pos;
    return marks.link.isInSet(nodeBefore?.marks ?? []) ?? marks.link.isInSet(nodeAfter?.marks ?? []);
};

const firstLinkBetween = (doc: Node, from: number, to: number) => {
    let link: Mark | undefined;
    doc.nodesBetween(from, to, (node) => {
        link ??= marks.link.isInSet(node.marks);
        return !link;
    });
    return link;
};

/** the range of the inline nodes around the position that carry the mark, e.g. a partly bold link */
const markRangeAround = ($pos: ResolvedPos, mark: Mark) => {
    const { parent } = $pos;
    const hasMark = (index: number) => mark.isInSet(parent.child(index).marks);

    let startIndex = $pos.index();
    let from = $pos.posAtIndex(startIndex);
    while (startIndex > 0 && hasMark(startIndex - 1)) {
        startIndex--;
        from -= parent.child(startIndex).nodeSize;
    }

    let endIndex = $pos.index();
    let to = $pos.posAtIndex(endIndex);
    while (endIndex < parent.childCount && hasMark(endIndex)) {
        to += parent.child(endIndex).nodeSize;
        endIndex++;
    }
    return { from, to };
};
