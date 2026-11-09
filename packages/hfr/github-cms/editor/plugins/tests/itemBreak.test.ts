import type { Node } from 'prosemirror-model';
import { EditorState, NodeSelection, type Selection, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { serializeMarkdown } from '../../markdown';
import { schema } from '../../schema';
import { deleteItemBreak } from '../itemBreak';

const { nodes } = schema;

const paragraph = (text?: string) => nodes.paragraph.create(null, text ? schema.text(text) : null);
const itemBreak = () => nodes.leaf_directive.create({ name: 'br' });
const cards = (...content: Node[]) =>
    nodes.doc.create(null, [
        nodes.container_directive.create({ name: 'cards' }, content),
        paragraph('After')
    ]);

/** the position of the n-th child of the cards */
const childPos = (doc: Node, n: number) => {
    let pos = 1;
    for (let i = 0; i < n; i++) {
        pos += doc.firstChild!.child(i).nodeSize;
    }
    return pos;
};

const backspace = (doc: Node, selection: Selection) => {
    let result: EditorState | null = null;
    const handled = deleteItemBreak(EditorState.create({ doc, selection }), (tr) => {
        result = EditorState.create({ doc: tr.doc, selection: tr.selection });
    });
    return { handled, result: result as EditorState | null };
};

/** the text of the cursor's textblock, with `|` at the cursor */
const cursorContext = (state: EditorState) => {
    const { $from } = state.selection;
    const text = $from.parent.textContent;
    return `${text.slice(0, $from.parentOffset)}|${text.slice($from.parentOffset)}`;
};

describe('deleteItemBreak', () => {
    it('removes the ::br and the empty item, the cursor goes to the end of the previous item', () => {
        const doc = cards(paragraph('A'), itemBreak(), paragraph());
        const { handled, result } = backspace(doc, TextSelection.create(doc, childPos(doc, 2) + 1));
        expect(handled).toBe(true);
        expect(serializeMarkdown(result!.doc)).toMatchInlineSnapshot(`
          ":::cards
          A
          :::

          After
          "
        `);
        expect(cursorContext(result!)).toBe('A|');
    });

    it('keeps the content of a non-empty item', () => {
        const doc = cards(paragraph('A'), itemBreak(), paragraph('B'));
        const { result } = backspace(doc, TextSelection.create(doc, childPos(doc, 2) + 1));
        expect(serializeMarkdown(result!.doc)).toMatchInlineSnapshot(`
          ":::cards
          A

          B
          :::

          After
          "
        `);
        expect(cursorContext(result!)).toBe('A|');
    });

    it('removes a selected ::br, the cursor goes to the end of the previous item', () => {
        const doc = cards(paragraph('A'), itemBreak());
        const { result } = backspace(doc, NodeSelection.create(doc, childPos(doc, 1)));
        expect(serializeMarkdown(result!.doc)).toMatchInlineSnapshot(`
          ":::cards
          A
          :::

          After
          "
        `);
        expect(cursorContext(result!)).toBe('A|');
    });

    it('is not handled when the cursor is not at the start of the block', () => {
        const doc = cards(paragraph('A'), itemBreak(), paragraph('B'));
        const { handled } = backspace(doc, TextSelection.create(doc, childPos(doc, 2) + 2));
        expect(handled).toBe(false);
    });

    it('is not handled when no ::br precedes the block', () => {
        const doc = cards(paragraph('A'), paragraph('B'));
        const { handled } = backspace(doc, TextSelection.create(doc, childPos(doc, 1) + 1));
        expect(handled).toBe(false);
    });
});
