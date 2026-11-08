import { describe, expect, it } from 'vitest';
import { parseCaption, serializeCaption } from '../caption';
import { imageMarkdown, rawImageAlt } from '../imageAlt';

const roundtrip = (markdown: string) => serializeCaption(parseCaption(markdown));

describe('image captions', () => {
    it('keeps inline markdown', () => {
        expect(roundtrip('**Fig. 1** a __boxed__ [[Ctrl]] and :mdi[robot]')).toBe(
            '**Fig. 1** a __boxed__ [[Ctrl]] and :mdi[robot]'
        );
    });

    it('keeps block syntax as plain text', () => {
        expect(parseCaption('# Title').textContent).toBe('# Title');
    });

    it('parses an empty caption', () => {
        expect(roundtrip('')).toBe('');
    });
});

describe('image markdown', () => {
    const altAfterRoundtrip = (caption: string) => {
        const markdown = imageMarkdown('./cat.png', serializeCaption(parseCaption(caption)), null);
        return rawImageAlt(markdown);
    };

    it('escapes unmatched brackets, they would break the image syntax', () => {
        expect(altAfterRoundtrip('a ] b [c')).toBe('a \\] b \\[c');
    });

    it('keeps balanced brackets', () => {
        expect(altAfterRoundtrip('[[Ctrl]] and :mdi[robot]')).toBe('[[Ctrl]] and :mdi[robot]');
    });
});
