import { baseKeymap } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import { type Command, EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import {
    insertInlineMdx,
    liftNestedListItem,
    liftOutOfBlockquote,
    liftOutOfBlockquoteAt,
    linkAtSelection,
    removeLink,
    setLink,
    toggleMarkOnWord,
    withoutSpacesAtCursor
} from '../commands';
import { parseMarkdown, serializeMarkdown } from '../markdown';
import { schema } from '../schema';

const enter = withoutSpacesAtCursor(baseKeymap.Enter);

/** presses Enter after the first occurrence of `before` */
const pressEnterAfter = (source: string, before: string) => {
    const { doc } = parseMarkdown(source);
    let cursor = -1;
    doc.descendants((node: Node, pos) => {
        if (cursor < 0 && node.isTextblock && node.textContent.includes(before)) {
            cursor = pos + 1 + node.textContent.indexOf(before) + before.length;
        }
        return cursor < 0;
    });
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    enter(state, (tr) => {
        state = state.apply(tr);
    });
    return { markdown: serializeMarkdown(state.doc), cursorText: state.selection.$from.parent.textContent };
};

describe('withoutSpacesAtCursor', () => {
    it('removes the spaces at the cursor when splitting a paragraph', () => {
        const result = pressEnterAfter('First second\n', 'First ');
        expect(result.markdown).toBe('First\n\nsecond\n');
        expect(result.cursorText).toBe('second');
    });

    it('splits as usual without spaces at the cursor', () => {
        expect(pressEnterAfter('Firstsecond\n', 'First').markdown).toBe('First\n\nsecond\n');
    });

    it('keeps the spaces when the command is not applicable', () => {
        const { doc } = parseMarkdown('Text  here\n');
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, 6) });
        expect(withoutSpacesAtCursor(() => false)(state, () => undefined)).toBe(false);
    });
});

describe('toggleMarkOnWord', () => {
    const italic = toggleMarkOnWord(schema.marks.emphasis);

    /** toggles italic with the cursor after the first occurrence of `before` */
    const toggleItalicAt = (source: string, before: string) => {
        const { doc } = parseMarkdown(source);
        const cursor = 1 + doc.textContent.indexOf(before) + before.length;
        let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
        italic(state, (tr) => {
            state = state.apply(tr);
        });
        return serializeMarkdown(state.doc);
    };

    it('makes the word at the cursor italic', () => {
        expect(toggleItalicAt('one foo two\n', 'one fo')).toBe('one *foo* two\n');
    });

    it('applies to the word at its start and its end', () => {
        expect(toggleItalicAt('one foo two\n', 'one ')).toBe('one *foo* two\n');
        expect(toggleItalicAt('one foo two\n', 'one foo')).toBe('one *foo* two\n');
    });

    it('removes italic from an italic word', () => {
        expect(toggleItalicAt('one *foo* two\n', 'one fo')).toBe('one foo two\n');
    });

    it('treats umlauts and digits as part of the word', () => {
        expect(toggleItalicAt('ein Äpfel2 hier\n', 'ein Äp')).toBe('ein *Äpfel2* hier\n');
    });

    it('stores the mark for the next input between spaces', () => {
        const { doc } = parseMarkdown('one  two\n');
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, 5) });
        let next = state;
        italic(state, (tr) => {
            next = state.apply(tr);
        });
        expect(serializeMarkdown(next.doc)).toBe('one  two\n');
        expect(next.storedMarks?.map((mark) => mark.type.name)).toEqual(['emphasis']);
    });
});

describe('insertInlineMdx', () => {
    /** inserts inline mdx after the first occurrence of `before` and types `typed` over the placeholder */
    const insertAndTypeAt = (source: string, before: string, typed: string) => {
        const { doc } = parseMarkdown(source);
        const cursor = 1 + doc.textContent.indexOf(before) + before.length;
        let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
        insertInlineMdx(state, (tr) => {
            state = state.apply(tr);
        });
        state = state.apply(state.tr.insertText(typed));
        return serializeMarkdown(state.doc);
    };

    it('inserts a span written as is, with the placeholder replaced by the typed text', () => {
        expect(insertAndTypeAt('one two\n', 'one ', '*a*')).toBe('one <span>*a*</span>two\n');
    });

    it('replaces inline code at the cursor', () => {
        expect(insertAndTypeAt('one `code` two\n', 'one co', 'x')).toBe('one `co`<span>x</span>`de` two\n');
    });
});

/** runs the command with the cursor after the first occurrence of `text` */
const runAfter = (source: string, text: string, command: Command) => {
    const { doc } = parseMarkdown(source);
    let cursor = -1;
    doc.descendants((node: Node, pos) => {
        if (cursor < 0 && node.isTextblock && node.textContent.includes(text)) {
            cursor = pos + 1 + node.textContent.indexOf(text) + text.length;
        }
        return cursor < 0;
    });
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    const isApplied = command(state, (tr) => {
        state = state.apply(tr);
    });
    return isApplied ? serializeMarkdown(state.doc) : null;
};

describe('liftOutOfBlockquote', () => {
    it('moves the whole list out of the quote', () => {
        expect(runAfter('> Frage\n>\n> 1. A\n> 2. B\n', 'B', liftOutOfBlockquote)).toBe(
            '> Frage\n\n1. A\n2. B\n'
        );
    });

    it('splits the quote around the block', () => {
        expect(runAfter('> Erstens\n>\n> Zweitens\n>\n> Drittens\n', 'Zweitens', liftOutOfBlockquote)).toBe(
            '> Erstens\n\nZweitens\n\n> Drittens\n'
        );
    });

    it('does not apply outside of a quote', () => {
        expect(runAfter('1. A\n', 'A', liftOutOfBlockquote)).toBeNull();
    });
});

describe('liftOutOfBlockquoteAt', () => {
    it('moves the block at the position out of its quote', () => {
        const { doc } = parseMarkdown('> Frage\n>\n> - A\n');
        const listPos = 1 + doc.firstChild!.firstChild!.nodeSize;
        let state = EditorState.create({ doc });
        liftOutOfBlockquoteAt(listPos)(state, (tr) => {
            state = state.apply(tr);
        });
        expect(serializeMarkdown(state.doc)).toBe('> Frage\n\n- A\n');
    });
});

describe('liftNestedListItem', () => {
    it('outdents nested list items only', () => {
        expect(runAfter('- A\n  - B\n', 'B', liftNestedListItem)).toBe('- A\n- B\n');
        expect(runAfter('> - A\n', 'A', liftNestedListItem)).toBeNull();
    });
});

describe('links', () => {
    /** applies the command with the cursor after the first occurrence of `before` */
    const runAt = (source: string, before: string, command: Command) => {
        const { doc } = parseMarkdown(source);
        const cursor = 1 + doc.textContent.indexOf(before) + before.length;
        let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
        command(state, (tr) => {
            state = state.apply(tr);
        });
        return serializeMarkdown(state.doc);
    };

    it('finds the whole link around the cursor, also when it is partly bold', () => {
        const { doc } = parseMarkdown('See [a **bold** link](https://a.ch) here\n');
        const cursor = 1 + doc.textContent.indexOf('bo');
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
        const link = linkAtSelection(state);
        expect(link?.attrs.href).toBe('https://a.ch');
        expect(doc.textBetween(link!.from, link!.to)).toBe('a bold link');
    });

    it('changes the href of the whole link around the cursor', () => {
        expect(runAt('See [a **bold** link](https://a.ch) here\n', 'li', setLink('https://b.ch'))).toBe(
            'See [a **bold** link](https://b.ch) here\n'
        );
    });

    it('keeps the title of the link when changing its href', () => {
        expect(runAt('See [a link](https://a.ch "Title") here\n', 'a l', setLink('https://b.ch'))).toBe(
            'See [a link](https://b.ch "Title") here\n'
        );
    });

    it('inserts the href as link text outside a link', () => {
        expect(runAt('See here\n', 'See ', setLink('https://b.ch'))).toBe(
            'See [https://b.ch](https://b.ch)here\n'
        );
    });

    it('removes the whole link around the cursor', () => {
        expect(runAt('See [a **bold** link](https://a.ch) here\n', 'a b', removeLink)).toBe(
            'See a **bold** link here\n'
        );
    });
});
