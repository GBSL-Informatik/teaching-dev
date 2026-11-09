import { describe, expect, it } from 'vitest';
import { fuzzyScore } from '../fuzzyScore';

describe('fuzzyScore', () => {
    it('ranks a prefix above a word prefix, a substring and a subsequence', () => {
        const prefix = fuzzyScore('tab', ['Tabelle']);
        const wordPrefix = fuzzyScore('karte', ['Nächste Karte/Spalte']);
        const substring = fuzzyScore('belle', ['Tabelle']);
        const subsequence = fuzzyScore('tbl', ['Tabelle']);

        expect(prefix).toBeGreaterThan(wordPrefix);
        expect(wordPrefix).toBeGreaterThan(substring);
        expect(substring).toBeGreaterThan(subsequence);
        expect(subsequence).toBeGreaterThan(0);
    });

    it('uses the best matching term', () => {
        expect(fuzzyScore('adm', ['Hinweis: tip', 'admonition', 'tip'])).toBe(
            fuzzyScore('adm', ['admonition'])
        );
    });

    it('ignores case and diacritics', () => {
        expect(fuzzyScore('LOSUNG', ['Lösung'])).toBe(fuzzyScore('lösung', ['Lösung']));
    });

    it('matches everything with an empty query', () => {
        expect(fuzzyScore('', ['Tabelle'])).toBeGreaterThan(0);
    });

    it('is 0 when nothing matches', () => {
        expect(fuzzyScore('xyz', ['Tabelle', 'table'])).toBe(0);
        expect(fuzzyScore('tip', [])).toBe(0);
    });
});
