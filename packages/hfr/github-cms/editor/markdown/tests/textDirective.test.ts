import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '..';
import { schema } from '../../schema';

const inlineTypes = (source: string) => {
    const { doc } = parseMarkdown(source);
    return doc.firstChild!.content.content.map((node) => node.type.name);
};

const serializeText = (text: string) => {
    const doc = schema.node('doc', null, [schema.node('paragraph', null, [schema.text(text)])]);
    return serializeMarkdown(doc, '\n');
};

describe('text directives', () => {
    it('ignores a colon within a word', () => {
        expect(inlineTypes('Schüler:innen und 12:30')).toEqual(['text']);
    });

    it('starts at the start of the text, after whitespace and after punctuation', () => {
        expect(inlineTypes(':mdi[a] b :mdi[c] (:mdi[d]) **:mdi[e]**')).toEqual([
            'text_directive',
            'text',
            'text_directive',
            'text',
            'text_directive',
            'text',
            'text_directive'
        ]);
    });

    it('does not escape a colon within a word', () => {
        expect(serializeText('Lehrer:innen um 12:30')).toBe('Lehrer:innen um 12:30\n');
    });

    it('escapes a colon which would start a directive', () => {
        expect(serializeText(':a b :c (:d)')).toBe('\\:a b \\:c (\\:d)\n');
    });
});
