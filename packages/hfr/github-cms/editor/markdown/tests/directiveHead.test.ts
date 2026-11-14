import type { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '..';
import { directiveHeadOf, itemBreakHeadOf, parseDirectiveHead, parseItemBreakHead } from '../directiveHead';

const DIRECTIVE_TYPES = ['container_directive', 'items_directive', 'leaf_directive'];

const firstDirective = (doc: Node) => {
    let found: { node: Node; pos: number } | undefined;
    doc.descendants((node, pos) => {
        if (!found && DIRECTIVE_TYPES.includes(node.type.name)) {
            found = { node, pos };
        }
        return !found;
    });
    if (!found) {
        throw new Error('no directive found');
    }
    return found;
};

const directiveOf = (source: string) => firstDirective(parseMarkdown(source).doc).node;

/**
 * Parses `source`, replaces the head of the first directive and returns the serialized result.
 */
const editHead = (source: string, text: string) => {
    const { doc, trailing } = parseMarkdown(source);
    const { node, pos } = firstDirective(doc);
    const head = parseDirectiveHead(text, node);
    const tr = EditorState.create({ doc }).tr.setNodeMarkup(pos, null, { ...node.attrs, ...head });
    return serializeMarkdown(tr.doc, trailing);
};

describe('directiveHeadOf', () => {
    it('returns the name and the attributes of a container directive', () => {
        expect(directiveHeadOf(directiveOf(':::tip[Title]{#id .red a="1"}\nText\n:::\n'))).toBe(
            ':::tip{#id .red a="1"}'
        );
    });

    it('returns the name and the attributes of a leaf directive', () => {
        expect(directiveHeadOf(directiveOf('::youtube[Video]{#abc}\n'))).toBe('::youtube{#abc}');
    });
});

describe('parseDirectiveHead', () => {
    const tip = directiveOf(':::tip\nText\n:::\n');
    const youtube = directiveOf('::youtube{#abc}\n');

    it('parses ids, classes and attributes', () => {
        expect(parseDirectiveHead(':::note{#id .red .big a="1" b=2 c}', tip)).toEqual({
            name: 'note',
            attributes: { id: 'id', class: 'red big', a: '1', b: '2', c: '' }
        });
    });

    it('parses the head of a leaf directive', () => {
        expect(parseDirectiveHead('::vimeo{#xyz}', youtube)).toEqual({
            name: 'vimeo',
            attributes: { id: 'xyz' }
        });
    });

    it('reports a missing quote', () => {
        expect(() => parseDirectiveHead(':::tip{a="1 b="2}', tip)).toThrowError(/Anführungszeichen/);
        expect(() => parseDirectiveHead('::youtube{a="1}', youtube)).toThrowError(/Anführungszeichen/);
    });

    it('reports a missing brace', () => {
        expect(() => parseDirectiveHead(':::tip{a="1"', tip)).toThrowError(/Klammer/);
    });

    it('reports the wrong kind of directive', () => {
        expect(() => parseDirectiveHead('::tip', tip)).toThrowError(/:::name/);
        expect(() => parseDirectiveHead(':::youtube', youtube)).toThrowError(/::name/);
    });

    it('reports a title', () => {
        expect(() => parseDirectiveHead(':::tip[Title]', tip)).toThrowError(/Titel/);
        expect(() => parseDirectiveHead('::youtube[Video]{#abc}', youtube)).toThrowError(/Titel/);
    });

    it('does not turn a directive into :::cards or :::flex and back', () => {
        expect(() => parseDirectiveHead(':::cards', tip)).toThrowError(/umbenannt/);
        expect(() => parseDirectiveHead(':::tip', directiveOf(':::cards\nA\n::br\nB\n:::\n'))).toThrowError(
            /umbenannt/
        );
    });
});

describe('itemBreakHeadOf', () => {
    it('returns the attributes of the ::br without its label', () => {
        const cards = directiveOf(':::cards\nA\n::br[Label]{.red a="1"}\nB\n:::\n');
        expect(itemBreakHeadOf(cards.child(1))).toBe('::br{.red a="1"}');
    });
});

describe('parseItemBreakHead', () => {
    it('parses ids, classes and attributes', () => {
        expect(parseItemBreakHead('::br{#id .red a="1"}')).toEqual({ id: 'id', class: 'red', a: '1' });
    });

    it('reports a missing quote', () => {
        expect(() => parseItemBreakHead('::br{a="1}')).toThrowError(/Anführungszeichen/);
    });

    it('reports a title', () => {
        expect(() => parseItemBreakHead('::br[Label]')).toThrowError(/Titel/);
    });

    it('does not rename the ::br', () => {
        expect(() => parseItemBreakHead('::youtube{#abc}')).toThrowError(/umbenannt/);
    });
});

describe('editing the head', () => {
    it('keeps the title and the content', () => {
        expect(editHead(':::tip[Title]\nText\n:::\n', ':::warning{.red}')).toBe(
            ':::warning[Title]{.red}\nText\n:::\n'
        );
    });

    it('keeps the label of a leaf directive', () => {
        expect(editHead('::youtube[Video]{#abc}\n', '::youtube{#xyz}')).toBe('::youtube[Video]{#xyz}\n');
    });

    it('keeps a longer fence of a nested directive', () => {
        const source = '::::details\n:::tip\nText\n:::\n::::\n';
        expect(editHead(source, ':::details{.open}')).toBe('::::details{.open}\n:::tip\nText\n:::\n::::\n');
    });
});
