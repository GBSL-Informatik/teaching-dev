import { describe, expect, it } from 'vitest';
import { annotationsOf } from '../annotate/annotationsOf';
import { compactText, createTextLocator } from '../annotate/locateText';
import { PdfPage, PdfText } from '../annotate/readPdf';
import { extractChecks } from '../checks/extractChecks';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { loadFixture } from './loadFixture';

const line = (str: string, y: number): PdfText => ({ str, x: 70, y, width: str.length * 5, height: 11 });

const pageOf = (texts: PdfText[]): PdfPage => ({
    index: 0,
    widthPt: 595,
    heightPt: 842,
    texts,
    renderPng: async () => Buffer.alloc(0)
});

describe('locateText', () => {
    it('compares letters and digits only, so ligatures, hyphens and spaces do not matter', () => {
        expect(compactText('ﬁlms „furi-\nously“ 1s')).toBe('filmsfuriously1s');
    });

    it('finds a text broken across lines, and its later occurrences', () => {
        const locator = createTextLocator([
            pageOf([
                line('programmers furi-', 100),
                line('ously typing', 112),
                line('programmers furiously', 300)
            ])
        ]);

        expect(locator.locate('programmers furiously')).toMatchObject({ page: 0, y: 100 });
        expect(locator.locate('programmers furiously', 1)).toMatchObject({ page: 0, y: 300 });
        expect(locator.locate('programmers furiously', 2)).toBeUndefined();
    });
});

describe('annotationsOf', () => {
    it('points to the heading, not to its entry in the table of contents before it', async () => {
        const original = await loadFixture('21E_MachineLearning');
        const normalize = createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS);
        const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'paragraphStyle' && check.expect.style === 'heading 1'
        );
        const locator = createTextLocator([
            pageOf([line('1 Begriffsklärung 1', 100), line('Begriffsklärung', 500)])
        ]);

        const annotations = annotationsOf(checks, original, locator, normalize);

        expect(annotations).toEqual([
            { label: '«Überschrift 1»', target: expect.objectContaining({ y: 500 }) }
        ]);
    });
});
