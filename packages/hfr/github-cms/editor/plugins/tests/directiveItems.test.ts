import { chainCommands, joinBackward } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import { type Command, EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '../../markdown';
import { schema } from '../../schema';
import { deleteEmptyDirectiveItem, enterInDirectiveItem, splitDirectiveItem } from '../directiveItems';

/** the position in the textblock containing `text`, `offset` characters after its start */
const positionIn = (doc: Node, text: string, offset: number) => {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found < 0 && node.isTextblock && node.textContent.includes(text)) {
            found = pos + 1 + node.textContent.indexOf(text) + offset;
        }
        return found < 0;
    });
    if (found < 0) {
        throw new Error(`"${text}" not found`);
    }
    return found;
};

/** runs the command with the cursor at `cursor`, returns the markdown and the text around the cursor */
const run = (command: Command, doc: Node, cursor: number) => {
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    const handled = command(state, (tr) => {
        state = state.apply(tr);
    });
    const { $from } = state.selection;
    const text = $from.parent.textContent;
    return {
        handled,
        markdown: serializeMarkdown(state.doc),
        cursor: `${text.slice(0, $from.parentOffset)}|${text.slice($from.parentOffset)}`
    };
};

const CARDS = parseMarkdown(':::cards\nFirst card\n\n::br{.x}\nSecond card\n:::\n').doc;

/** the end of the first card's paragraph */
const END_OF_FIRST = positionIn(CARDS, 'First card', 'First card'.length);

/** an empty paragraph appended to the first item, as after pressing Enter at its end */
const withEmptyParagraph = (doc: Node) => {
    return EditorState.create({ doc }).tr.insert(END_OF_FIRST + 1, schema.nodes.paragraph.create()).doc;
};

describe('splitDirectiveItem', () => {
    it('moves the text after the cursor into a new item, without the spaces at the split', () => {
        const result = run(splitDirectiveItem, CARDS, positionIn(CARDS, 'First card', 6));
        expect(result.markdown).toMatchInlineSnapshot(`
          ":::cards
          First

          ::br

          card

          ::br{.x}
          Second card
          :::
          "
        `);
        expect(result.cursor).toBe('|card');
    });

    it('moves a whole block when the cursor is at its start', () => {
        const doc = parseMarkdown(':::flex\nLeft\n\nStill left\n:::\n').doc;
        const result = run(splitDirectiveItem, doc, positionIn(doc, 'Still left', 0));
        expect(result.markdown).toMatchInlineSnapshot(`
          ":::flex
          Left

          ::br

          Still left
          :::
          "
        `);
    });

    it('adds an empty item when nothing would remain in the current one', () => {
        const result = run(splitDirectiveItem, CARDS, positionIn(CARDS, 'First card', 0));
        expect(result.markdown).toMatchInlineSnapshot(`
          ":::cards
          First card

          ::br

          ::br{.x}
          Second card
          :::
          "
        `);
        expect(result.cursor).toBe('|');
    });

    it('is not handled outside of :::cards and :::flex', () => {
        const doc = parseMarkdown('Text\n').doc;
        expect(run(splitDirectiveItem, doc, positionIn(doc, 'Text', 0)).handled).toBe(false);
    });
});

describe('enterInDirectiveItem', () => {
    it('starts a new item from an empty last paragraph', () => {
        const result = run(enterInDirectiveItem, withEmptyParagraph(CARDS), END_OF_FIRST + 2);
        expect(result.handled).toBe(true);
        expect(result.markdown).toMatchInlineSnapshot(`
          ":::cards
          First card

          ::br

          ::br{.x}
          Second card
          :::
          "
        `);
    });

    it('is not handled in a paragraph with text', () => {
        const result = run(enterInDirectiveItem, CARDS, END_OF_FIRST);
        expect(result.handled).toBe(false);
    });
});

describe('backspace at the start of an item', () => {
    const backspace = chainCommands(deleteEmptyDirectiveItem, joinBackward);

    it('removes an empty item, the cursor goes to the end of the previous item', () => {
        // the empty item after the first one: closing paragraph and item, opening item and paragraph
        const doc = EditorState.create({ doc: CARDS }).tr.insert(
            END_OF_FIRST + 2,
            schema.nodes.directive_item.createAndFill()!
        ).doc;
        const result = run(backspace, doc, END_OF_FIRST + 4);
        expect(result.markdown).toBe(serializeMarkdown(CARDS));
        expect(result.cursor).toBe('First card|');
    });

    it('joins a non-empty item with the previous one', () => {
        const result = run(backspace, CARDS, positionIn(CARDS, 'Second card', 0));
        expect(result.markdown).toMatchInlineSnapshot(`
          ":::cards
          First card

          Second card
          :::
          "
        `);
        expect(result.cursor).toBe('|Second card');
    });
});

describe('removing items', () => {
    it('keeps an empty item when the only item is removed', () => {
        const doc = parseMarkdown(':::flex\nOnly\n:::\n\nAfter\n').doc;
        let itemPos = -1;
        doc.descendants((node, pos) => {
            if (node.type === schema.nodes.directive_item) {
                itemPos = pos;
            }
        });
        const item = doc.nodeAt(itemPos)!;
        const tr = EditorState.create({ doc }).tr.delete(itemPos, itemPos + item.nodeSize);
        expect(serializeMarkdown(tr.doc)).toMatchInlineSnapshot(`
          ":::flex
          ::br
          :::

          After
          "
        `);
    });
});
