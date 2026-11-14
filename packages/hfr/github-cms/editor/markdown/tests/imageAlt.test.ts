import { describe, expect, it } from 'vitest';
import { imageMarkdown, rawImageAlt } from '../imageAlt';

describe('image markdown', () => {
    const altAfterRoundtrip = (alt: string) => rawImageAlt(imageMarkdown('./cat.png', alt, null));

    it('escapes unmatched brackets, they would break the image syntax', () => {
        expect(altAfterRoundtrip('a ] b [c')).toBe('a \\] b \\[c');
    });

    it('keeps balanced brackets', () => {
        expect(altAfterRoundtrip('[[Ctrl]] and :mdi[robot]')).toBe('[[Ctrl]] and :mdi[robot]');
    });

    it('keeps the markdown of the alt text', () => {
        expect(imageMarkdown('./cat.png', '**Fig. 1** --width=20em', 'Title')).toBe(
            '![**Fig. 1** --width=20em](./cat.png "Title")'
        );
    });
});
