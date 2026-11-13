import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../markdown';
import { arrowOutOfCode } from '../leaveCode';

/** the state with the cursor at the end of the only paragraph */
const stateAtEnd = (source: string) => {
    const { doc } = parseMarkdown(source);
    const end = doc.child(0).nodeSize - 1;
    return EditorState.create({ doc, selection: TextSelection.create(doc, end) });
};

/** every position is at the end of its textblock */
const view = { endOfTextblock: () => true } as Pick<EditorView, 'endOfTextblock'> as EditorView;

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
