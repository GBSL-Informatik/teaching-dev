import type { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '..';
import { jsxOpeningTagOf, parseJsxOpeningTag, withJsxOpeningTag } from '../jsxOpeningTag';

const firstJsxNode = (doc: Node) => {
    let found: { node: Node; pos: number } | undefined;
    doc.descendants((node, pos) => {
        if (!found && node.type.name.startsWith('jsx_flow')) {
            found = { node, pos };
        }
        return !found;
    });
    if (!found) {
        throw new Error('no jsx node found');
    }
    return found;
};

/**
 * Parses `source`, replaces the opening tag of the first jsx element and returns the serialized result.
 */
const editOpeningTag = (source: string, text: string) => {
    const { doc, trailing } = parseMarkdown(source);
    const { node, pos } = firstJsxNode(doc);
    const tag = parseJsxOpeningTag(text, node);
    const tr = EditorState.create({ doc }).tr.setNodeMarkup(pos, null, withJsxOpeningTag(node, tag));
    return serializeMarkdown(tr.doc, trailing);
};

const jsxNodeOf = (source: string) => firstJsxNode(parseMarkdown(source).doc).node;

describe('jsxOpeningTagOf', () => {
    it('returns the opening tag as written in the source', () => {
        const node = jsxNodeOf('<Foo\n  bar="baz"\n>\n  Text\n</Foo>\n');
        expect(jsxOpeningTagOf(node)).toBe('<Foo\n  bar="baz"\n>');
    });

    it('returns the self-closing tag of an element without content', () => {
        expect(jsxOpeningTagOf(jsxNodeOf("<Foo bar='baz' />\n"))).toBe("<Foo bar='baz' />");
    });
});

describe('parseJsxOpeningTag', () => {
    const node = jsxNodeOf('<Foo>\n  Text\n</Foo>\n');

    it('parses strings, booleans, expressions and spreads', () => {
        const tag = parseJsxOpeningTag('<Bar a="1" b c={[1, 2]} {...props}>', node);
        expect(tag.name).toBe('Bar');
        expect(tag.attributes).toEqual([
            { type: 'attribute', name: 'a', value: '1' },
            { type: 'attribute', name: 'b', value: null },
            { type: 'expressionAttribute', name: 'c', value: '[1, 2]' },
            { type: 'spread', value: '...props' }
        ]);
    });

    it('accepts the tag without its closing bracket', () => {
        expect(parseJsxOpeningTag('<Bar a="1"', node).source).toBe('<Bar a="1">');
    });

    it('reports a missing quote', () => {
        expect(() =>
            parseJsxOpeningTag('<BrowserWindow url="https://foo.bar lang="md"/>', node)
        ).toThrowError(/^Zeile 1, Spalte 45: Unexpected character `"`/);
    });

    it('reports a missing brace', () => {
        expect(() => parseJsxOpeningTag('<Bar a={1 >', node)).toThrowError();
    });

    it('reports an invalid expression', () => {
        expect(() => parseJsxOpeningTag('<Bar a={1 +} >', node)).toThrowError();
    });

    it('reports text that is not a single tag', () => {
        expect(() => parseJsxOpeningTag('Bar a="1"', node)).toThrowError(/genau ein Tag/);
        expect(() => parseJsxOpeningTag('<Bar /> text', node)).toThrowError(/genau ein Tag/);
    });

    it('reports a missing name', () => {
        expect(() => parseJsxOpeningTag('<>', node)).toThrowError(/Name/);
    });
});

describe('editing the opening tag', () => {
    it('keeps the formatting of the typed tag', () => {
        const result = editOpeningTag('<Foo>\n  Text\n</Foo>\n', '<Foo\n  a="1"\n  b={2}\n>');
        expect(result).toBe('<Foo\n  a="1"\n  b={2}\n>\n  Text\n</Foo>\n');
    });

    it('renames the element, including its closing tag', () => {
        expect(editOpeningTag('<Foo>\n  Text\n</Foo>\n', '<Bar>')).toBe('<Bar>\n  Text\n</Bar>\n');
    });

    it('keeps an element without content self-closing', () => {
        expect(editOpeningTag('<Foo />\n', '<Foo a="1">')).toBe('<Foo a="1" />\n');
    });

    it('keeps the indentation of a nested element', () => {
        const source = '<Outer>\n  <Inner>\n    Text\n  </Inner>\n</Outer>\n';
        const { doc, trailing } = parseMarkdown(source);
        let inner: { node: Node; pos: number } | undefined;
        doc.descendants((node, pos) => {
            if (node.attrs.name === 'Inner') {
                inner = { node, pos };
            }
        });
        const tag = parseJsxOpeningTag('<Inner\n  a="1"\n>', inner!.node);
        const tr = EditorState.create({ doc }).tr.setNodeMarkup(
            inner!.pos,
            null,
            withJsxOpeningTag(inner!.node, tag)
        );
        expect(serializeMarkdown(tr.doc, trailing)).toBe(
            '<Outer>\n  <Inner\n    a="1"\n  >\n    Text\n  </Inner>\n</Outer>\n'
        );
    });
});
