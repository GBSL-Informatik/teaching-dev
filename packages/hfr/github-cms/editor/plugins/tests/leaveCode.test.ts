import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '../../markdown';
import { arrowOutOfCode, leaveCode } from '../leaveCode';

/** the state with the cursor at the end of the only paragraph */
const stateAtEnd = (source: string) => {
    const { doc } = parseMarkdown(source);
    const end = doc.child(0).nodeSize - 1;
    return EditorState.create({ doc, selection: TextSelection.create(doc, end) });
};

/** every position is at the end of its textblock */
const view = { endOfTextblock: () => true } as Pick<EditorView, 'endOfTextblock'> as EditorView;

/** types the text character by character at the cursor, handled by the plugin or inserted */
const type = (initial: EditorState, text: string) => {
    const plugin = leaveCode();
    let state = initial;
    const typingView = {
        get state() {
            return state;
        },
        dispatch: (tr) => {
            state = state.apply(tr);
        }
    } as Pick<EditorView, 'state' | 'dispatch'> as EditorView;
    for (const char of text) {
        const { from, to } = state.selection;
        const isHandled = plugin.props.handleTextInput!.call(
            plugin,
            typingView,
            from,
            to,
            char,
            () => state.tr
        );
        if (!isHandled) {
            typingView.dispatch(state.tr.insertText(char));
        }
    }
    return serializeMarkdown(state.doc, '');
};

const markNamesAtCursor = (state: EditorState) => {
    const marks = state.storedMarks ?? state.selection.$from.marks();
    return marks.map((mark) => mark.type.name);
};

describe('leaving inline mdx', () => {
    it('extends the inline mdx with text typed at its end', () => {
        const state = stateAtEnd('Text <Foo />\n');
        const { from } = state.selection;
        const deleted = state.apply(state.tr.delete(from - 1, from));
        expect(markNamesAtCursor(deleted)).toEqual(['raw']);

        const retyped = deleted.apply(deleted.tr.insertText('>'));
        const inlineMdx = retyped.doc.child(0).lastChild!;
        expect(inlineMdx.text).toBe('<Foo />');
        expect(inlineMdx.marks.map((mark) => mark.type.name)).toEqual(['raw']);
    });

    it('leaves the inline mdx with the arrow key at the end of the textblock', () => {
        let state = stateAtEnd('Text <Foo />\n');
        const isHandled = arrowOutOfCode('right')(state, (tr) => (state = state.apply(tr)), view);

        expect(isHandled).toBe(true);
        expect(markNamesAtCursor(state)).toEqual([]);
    });
});

describe('leaving inline code or mdx with two spaces', () => {
    it('leaves inline mdx at the end of the textblock', () => {
        expect(type(stateAtEnd('Text <Foo />\n'), '  next')).toBe('Text <Foo /> next');
    });

    it('leaves inline code in the middle of a paragraph', () => {
        const { doc } = parseMarkdown('Use `a` here\n');
        const afterCode = 1 + 'Use a'.length;
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, afterCode) });
        expect(type(state, '  b')).toBe('Use `a` b here');
    });

    it('keeps a single space in the inline code', () => {
        expect(type(stateAtEnd('Use `a`\n'), ' b')).toBe('Use `a b`');
    });
});
