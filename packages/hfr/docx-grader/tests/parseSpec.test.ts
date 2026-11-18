import { describe, expect, it } from 'vitest';
import { parseSpec } from '../spec/DocxSpec';

describe('parseSpec', () => {
    it('rejects data that is not a spec', () => {
        expect(parseSpec({ checks: [] }).spec).toBeUndefined();
        expect(parseSpec('version: 1').spec).toBeUndefined();
    });

    it('leaves out checks of unknown kinds and reports them', () => {
        const { spec, errors } = parseSpec({
            version: 1,
            source: 'original.docx',
            checks: [
                {
                    id: 'a',
                    kind: 'documentSettings',
                    title: 'Silbentrennung',
                    expect: { autoHyphenation: true }
                },
                { id: 'b', kind: 'wordArt', title: 'WordArt', expect: {} },
                { kind: 'field' }
            ]
        });

        expect(spec?.checks.map((check) => check.id)).toEqual(['a']);
        expect(errors).toEqual([
            'Check «b» hat die unbekannte Art «wordArt».',
            'Check Nr. 3 hat keine «id».'
        ]);
    });

    it('rejects checks whose structure was broken by hand edits', () => {
        const { spec, errors } = parseSpec({
            version: 1,
            source: 'original.docx',
            equivalentCharacters: 'abc',
            checks: [
                { id: 'a', kind: 'paragraphStyle', title: 'Titel', expect: { style: 'Title' } },
                { id: 'b', kind: 'image', title: 'Bild', anchors: [{ text: 'x' }], expect: {} },
                { id: 'c', kind: 'field', title: 'Verzeichnis', expect: { type: 'tableOfContents' } },
                { id: 'c', kind: 'field', title: 'Verzeichnis', expect: { type: 'tableOfContents' } }
            ]
        });

        expect(spec?.checks.map((check) => check.id)).toEqual(['c']);
        expect(spec?.equivalentCharacters).toBeUndefined();
        expect(errors).toEqual([
            'Check «a» braucht eine Liste «anchors».',
            'Check «b» braucht eine Liste «anchors».',
            'Check «c» kommt mehrfach vor.',
            '«equivalentCharacters» muss eine Liste von Listen von Zeichen sein; sie wird ignoriert.'
        ]);
    });
});
