import { describe, expect, it } from 'vitest';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS, normalizeRuns } from '../checks/normalizeText';
import { INITIAL_RUN_FORMAT } from '../docx/formatting';

describe('normalizeText', () => {
    const normalize = createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS);

    it('treats dashes, quotes and apostrophes as equal', () => {
        expect(normalize('„Wozu“ – it’s')).toBe(normalize('"Wozu" - it\'s'));
    });

    it('collapses whitespace and drops soft hyphens', () => {
        expect(normalize('  Trai­nings-\tund  Testdaten \n')).toBe('Trainings- und Testdaten');
    });

    it('uses custom equivalences instead of the defaults', () => {
        const normalizeUmlauts = createNormalizer([['a', 'ä']]);

        expect(normalizeUmlauts('Bär')).toBe('Bar');
        expect(normalizeUmlauts('–')).toBe('–');
    });

    it('keeps the format of every character of the normalized runs', () => {
        const bold = { ...INITIAL_RUN_FORMAT, bold: true };
        const chars = normalizeRuns(
            [
                { text: 'Access ', format: INITIAL_RUN_FORMAT },
                { text: ' granted', format: bold }
            ],
            DEFAULT_EQUIVALENT_CHARACTERS
        );

        expect(chars.map(({ char }) => char).join('')).toBe('Access granted');
        expect(chars.at(-1)?.format.bold).toBe(true);
    });
});
