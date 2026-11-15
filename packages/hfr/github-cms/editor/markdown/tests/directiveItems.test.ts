import type { Node } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '..';
import { schema } from '../../schema';

const edit = (source: string, apply: (tr: Transaction) => void) => {
    const { doc, trailing } = parseMarkdown(source);
    const tr = EditorState.create({ doc }).tr;
    apply(tr);
    return serializeMarkdown(tr.doc, trailing);
};

/** the items of the first `:::cards` or `:::flex` and their positions */
const itemsOf = (doc: Node) => {
    const items: { node: Node; pos: number }[] = [];
    doc.descendants((node, pos) => {
        if (node.type === schema.nodes.directive_item) {
            items.push({ node, pos });
        }
        return items.length === 0 || node.type === schema.nodes.items_directive;
    });
    return items;
};

const SOURCE = `:::cards{flexBasis="200px"}
First card

More of the first card

::br{.alert .alert--danger}
Second card
::br

Third card
:::
`;

describe('items of :::cards and :::flex', () => {
    it('groups the blocks between ::br into items', () => {
        const { doc } = parseMarkdown(SOURCE);
        const items = itemsOf(doc).map(({ node }) => ({
            attributes: node.attrs.attributes,
            hasBreak: node.attrs.format.hasBreak,
            text: node.textBetween(0, node.content.size, '|')
        }));
        expect(items).toMatchInlineSnapshot(`
          [
            {
              "attributes": {},
              "hasBreak": false,
              "text": "First card|More of the first card",
            },
            {
              "attributes": {
                "class": "alert alert--danger",
              },
              "hasBreak": true,
              "text": "Second card",
            },
            {
              "attributes": {},
              "hasBreak": true,
              "text": "Third card",
            },
          ]
        `);
    });

    it('keeps an unchanged first item starting with ::br', () => {
        const source = ':::flex\n::br\nLeft\n::br\nRight\n:::\n';
        const { doc, trailing } = parseMarkdown(source);
        expect(itemsOf(doc).map(({ node }) => node.attrs.format.hasBreak)).toEqual([true, true]);
        expect(serializeMarkdown(doc, trailing)).toBe(source);
    });

    it('omits the ::br of an edited first item without props', () => {
        const source = ':::flex\n::br\nLeft\n::br{.right}\nRight\n:::\n';
        const result = edit(source, (tr) => {
            const first = itemsOf(tr.doc)[0];
            tr.insertText('!', first.pos + first.node.content.size);
        });
        expect(result).toMatchInlineSnapshot(`
          ":::flex
          Left!

          ::br{.right}
          Right
          :::
          "
        `);
    });

    it('keeps the ::br of an edited first item with attributes', () => {
        const source = ':::flex\n::br{.left}\nLeft\n:::\n';
        const result = edit(source, (tr) => {
            const first = itemsOf(tr.doc)[0];
            tr.insertText('!', first.pos + first.node.content.size);
        });
        expect(result).toBe(':::flex\n::br{.left}\nLeft!\n:::\n');
    });

    it('rewrites only the edited item, keeping its ::br and line breaks', () => {
        const result = edit(SOURCE, (tr) => {
            const second = itemsOf(tr.doc)[1];
            tr.insertText('!', second.pos + second.node.content.size);
        });
        expect(result).toMatchInlineSnapshot(`
          ":::cards{flexBasis="200px"}
          First card

          More of the first card

          ::br{.alert .alert--danger}
          Second card!

          ::br

          Third card
          :::
          "
        `);
    });

    it('adds a ::br when the first item is moved to another position', () => {
        const result = edit(SOURCE, (tr) => {
            const [first, second] = itemsOf(tr.doc);
            tr.delete(first.pos, first.pos + first.node.nodeSize);
            tr.insert(second.pos - first.node.nodeSize + second.node.nodeSize, first.node);
        });
        expect(result).toMatchInlineSnapshot(`
          ":::cards{flexBasis="200px"}
          ::br{.alert .alert--danger}
          Second card

          ::br

          First card

          More of the first card

          ::br

          Third card
          :::
          "
        `);
    });

    it('writes a new item with a blank line after its ::br', () => {
        const result = edit(SOURCE, (tr) => {
            const last = itemsOf(tr.doc).at(-1)!;
            const item = schema.nodes.directive_item.create(
                { attributes: { class: 'new' } },
                schema.nodes.paragraph.create(null, schema.text('New card'))
            );
            tr.insert(last.pos + last.node.nodeSize, item);
        });
        expect(result).toMatchInlineSnapshot(`
          ":::cards{flexBasis="200px"}
          First card

          More of the first card

          ::br{.alert .alert--danger}
          Second card
          ::br

          Third card

          ::br{.new}

          New card
          :::
          "
        `);
    });

    it('keeps empty items with their ::br', () => {
        const result = edit(SOURCE, (tr) => {
            const first = itemsOf(tr.doc)[0];
            const emptyItem = schema.nodes.directive_item.createAndFill()!;
            tr.replaceWith(first.pos, first.pos + first.node.nodeSize, emptyItem);
        });
        expect(result).toMatchInlineSnapshot(`
          ":::cards{flexBasis="200px"}
          ::br

          ::br{.alert .alert--danger}
          Second card
          ::br

          Third card
          :::
          "
        `);
        expect(itemsOf(parseMarkdown(result).doc)).toHaveLength(3);
    });
});
