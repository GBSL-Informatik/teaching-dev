import { baseKeymap } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { insertInlineMdx, toggleMarkOnWord, withoutSpacesAtCursor } from '../commands';
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
