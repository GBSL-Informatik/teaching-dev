import type { Node } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { schema } from '../../schema';
import { parseMarkdown, serializeMarkdown } from '..';

/**
 * Parses `source`, applies the edit and returns the serialized result.
 */
const edit = (source: string, apply: (tr: Transaction) => void) => {
    const { doc, trailing } = parseMarkdown(source);
    const state = EditorState.create({ doc });
    const tr = state.tr;
    apply(tr);
    return serializeMarkdown(state.apply(tr).doc, trailing);
};

/** position right before the end of the first textblock containing `text` */
const endOfTextblock = (doc: Node, text: string) => {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found < 0 && node.isTextblock && node.textContent.includes(text)) {
            found = pos + node.nodeSize - 1;
        }
        return found < 0;
    });
    if (found < 0) {
        throw new Error(`"${text}" not found`);
    }
    return found;
};

const findNode = (doc: Node, typeName: string) => {
    let found: { node: Node; pos: number } | undefined;
    doc.descendants((node, pos) => {
        if (!found && node.type.name === typeName) {
            found = { node, pos };
        }
        return !found;
    });
    if (!found) {
        throw new Error(`"${typeName}" not found`);
    }
    return found;
};

describe('serializing edited documents', () => {
    it('only rewrites the edited paragraph inside a directive', () => {
        const source = `:::info[Title]
Some __boxed__   text.

Edit *me* please
:::

*  untouched list
`;
        const result = edit(source, (tr) => tr.insertText('!', endOfTextblock(tr.doc, 'Edit')));
        expect(result).toMatchInlineSnapshot(`
          ":::info[Title]
          Some __boxed__   text.

          Edit *me* please!
          :::

          *  untouched list
          "
        `);
    });

    it('serializes box and kbd marks', () => {
        const result = edit('Press [[Ctrl]] and __this__ key.\n', (tr) =>
            tr.insertText(' Done', endOfTextblock(tr.doc, 'Press'))
        );
        expect(result).toBe('Press [[Ctrl]] and __this__ key. Done\n');
    });

    it('renumbers ordered lists when an item is removed', () => {
        const source = '3. first\n4. second\n5. third\n';
        const result = edit(source, (tr) => {
            const list = findNode(tr.doc, 'ordered_list');
            const first = list.node.child(0);
            tr.delete(list.pos + 1, list.pos + 1 + first.nodeSize);
        });
        expect(result).toBe('3. second\n4. third\n');
    });

    it('uses a longer fence for a directive containing directives', () => {
        const inner = schema.nodes.container_directive.create({ name: 'tip' }, [
            schema.nodes.paragraph.create(null, schema.text('inner'))
        ]);
        const outer = schema.nodes.container_directive.create({ name: 'details' }, [
            schema.nodes.directive_label.create(null, schema.text('Summary')),
            inner
        ]);
        const result = edit('Text\n', (tr) => tr.insert(tr.doc.content.size, outer));
        expect(result).toMatchInlineSnapshot(`
          "Text

          ::::details[Summary]
          :::tip
          inner
          :::
          ::::
          "
        `);
    });

    it('regenerates the opening tag of a jsx element when its attributes change', () => {
        const source = `<BrowserWindow
    url="old"
>
    Some   content
</BrowserWindow>
`;
        const result = edit(source, (tr) => {
            const { node, pos } = findNode(tr.doc, 'jsx_flow');
            tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                attributes: [{ type: 'attribute', name: 'url', value: 'new' }],
                format: { ...node.attrs.format, openingTag: undefined }
            });
        });
        expect(result).toMatchInlineSnapshot(`
          "<BrowserWindow url="new">
              Some   content
          </BrowserWindow>
          "
        `);
    });

    it('keeps the indentation of jsx children when a child is edited', () => {
        const source = `<Steps>
    1. First
    2. Second

    Some text
</Steps>
`;
        const result = edit(source, (tr) => tr.insertText('!', endOfTextblock(tr.doc, 'Some text')));
        expect(result).toMatchInlineSnapshot(`
          "<Steps>
              1. First
              2. Second

              Some text!
          </Steps>
          "
        `);
    });

    it('serializes tables with their alignment', () => {
        const source = `| a | b |
|:--|--:|
| 1 | 2 |
`;
        const result = edit(source, (tr) => tr.insertText('3', endOfTextblock(tr.doc, '2')));
        expect(result).toMatchInlineSnapshot(`
          "| a  |  b |
          | :- | -: |
          | 1  | 23 |
          "
        `);
    });

    it('keeps unknown mdx unchanged', () => {
        const source = `import Foo from './foo';

export const bar = 1;

Text with {bar} and <Foo inline />.
`;
        const result = edit(source, (tr) => tr.insertText('!', endOfTextblock(tr.doc, 'Text with')));
        expect(result).toBe(source.replace('/>.', '/>.!'));
    });
});
