import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../markdown';
import { rawRangeAt } from '../rawSelection';

/** the position before the first occurrence of `text` in the first paragraph */
const posOf = (source: string, text: string) => 1 + source.indexOf(text);

describe('rawRangeAt', () => {
    const source = 'Text with <Foo>**bar**</Foo> and more.';
    const { doc } = parseMarkdown(`${source}\n`);
    const raw = { from: posOf(source, '<Foo'), to: posOf(source, ' and') };

    it('finds the inline mdx from its start', () => {
        expect(rawRangeAt(doc, raw.from)).toEqual(raw);
    });

    it('finds the inline mdx from inside of it', () => {
        expect(rawRangeAt(doc, posOf(source, 'bar'))).toEqual(raw);
    });

    it('returns null outside of inline mdx', () => {
        expect(rawRangeAt(doc, posOf(source, 'with'))).toBeNull();
        expect(rawRangeAt(doc, raw.to)).toBeNull();
    });
});
