import type { Node } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '..';
import { schema } from '../../schema';

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

    it('recognizes kbd content spanning several nodes', () => {
        const source = 'Press [[Ctrl + :mdi[keyboard-return]]] to send.\n';
        const { doc } = parseMarkdown(source);
        const icon = findNode(doc, 'text_directive').node;
        expect(icon.marks.map((mark) => mark.type.name)).toEqual(['kbd']);
        expect(doc.textContent).toBe('Press Ctrl +  to send.');

        const result = edit(source, (tr) => tr.insertText('!', endOfTextblock(tr.doc, 'Press')));
        expect(result).toBe('Press [[Ctrl + :mdi[keyboard-return]]] to send.!\n');
    });

    it('keeps unmatched kbd brackets as text', () => {
        const result = edit('A [[ without end\n', (tr) => tr.insertText('!', endOfTextblock(tr.doc, 'A')));
        expect(result).toBe('A \\[\\[ without end!\n');
    });

    it('moves whitespace out of formatting marks', () => {
        const result = edit('Text\n', (tr) => {
            const end = endOfTextblock(tr.doc, 'Text');
            tr.insert(end, schema.text(' bold ', [schema.marks.strong.create()]));
            tr.insert(end + 6, schema.text('after'));
        });
        expect(result).toBe('Text **bold** after\n');
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
                attributes: [{ type: 'attribute', name: 'url', value: 'new' }]
            });
        });
        expect(result).toMatchInlineSnapshot(`
          "<BrowserWindow url="new">
              Some   content
          </BrowserWindow>
          "
        `);
    });

    it('regenerates the opening tag of a self-closing jsx element when its attributes change', () => {
        const result = edit('<String\n    id="abc"\n/>\n', (tr) => {
            const { node, pos } = findNode(tr.doc, 'jsx_flow_void');
            tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                attributes: [{ type: 'attribute', name: 'id', value: 'xyz' }]
            });
        });
        expect(result).toBe('<String id="xyz" />\n');
    });

    it('keeps the opening tag of a jsx element when its attributes are set to equal ones', () => {
        const source = `<BrowserWindow
    url="same"
>
    Some   content
</BrowserWindow>
`;
        const result = edit(source, (tr) => {
            const { node, pos } = findNode(tr.doc, 'jsx_flow');
            tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                attributes: [{ type: 'attribute', name: 'url', value: 'same' }]
            });
            // a changed node is serialized anew, only its opening tag is reused
            tr.insertText('!', endOfTextblock(tr.doc, 'Some   content'));
        });
        expect(result).toMatchInlineSnapshot(`
          "<BrowserWindow
              url="same"
          >
              Some   content!
          </BrowserWindow>
          "
        `);
    });

    it('self-closes a jsx element with empty content', () => {
        const result = edit('<String id="abc" />\n', (tr) => {
            // what "Inhalt hinzufügen" does, without typing any content
            const { node, pos } = findNode(tr.doc, 'jsx_flow_void');
            const element = schema.nodes.jsx_flow.create(node.attrs, schema.nodes.paragraph.create());
            tr.replaceWith(pos, pos + node.nodeSize, element);
        });
        expect(result).toBe('<String id="abc" />\n');
    });

    it('self-closes a jsx element when its content is removed', () => {
        const source = `<BrowserWindow
    url="https://gbsl.ch"
>
    Some content
</BrowserWindow>
`;
        const result = edit(source, (tr) => {
            const { pos } = findNode(tr.doc, 'paragraph');
            tr.delete(pos + 1, endOfTextblock(tr.doc, 'Some content'));
        });
        expect(result).toMatchInlineSnapshot(`
          "<BrowserWindow
              url="https://gbsl.ch" />
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

    it('writes inline mdx edited in place as is', () => {
        const source = 'Text with <Foo inline /> and *more*.\n';
        const paragraph = parseMarkdown(source).doc.child(0);
        expect(paragraph.child(1).marks.map((mark) => mark.type.name)).toEqual(['raw']);

        const result = edit(source, (tr) => {
            const afterInline = 1 + 'Text with <Foo inline'.length;
            tr.insertText(' a={1 * 2}', afterInline);
        });
        expect(result).toBe('Text with <Foo inline a={1 * 2} /> and *more*.\n');
    });
});

describe('image captions', () => {
    const resize = (source: string) =>
        edit(source, (tr) => {
            const { node, pos } = findNode(tr.doc, 'image');
            tr.setNodeMarkup(pos, null, { ...node.attrs, alt: `${node.attrs.alt} --width=200px` });
        });

    it('keeps the markdown of the alt text', () => {
        expect(resize('![**Fig. 1** a [[Ctrl]] key](./cat.png)\n')).toBe(
            '![**Fig. 1** a [[Ctrl]] key --width=200px](./cat.png)\n'
        );
    });

    it('keeps escaped brackets in the alt text', () => {
        expect(resize('![a \\] b](./cat.png "Title")\n')).toBe(
            '![a \\] b --width=200px](./cat.png "Title")\n'
        );
    });
});
