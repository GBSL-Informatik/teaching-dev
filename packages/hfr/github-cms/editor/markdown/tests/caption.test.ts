import { describe, expect, it } from 'vitest';
import { parseCaption, serializeCaption } from '../caption';

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
