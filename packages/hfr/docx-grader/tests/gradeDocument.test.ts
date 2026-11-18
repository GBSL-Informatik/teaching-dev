import { describe, expect, it } from 'vitest';
import { createAnchoring } from '../checks/anchors';
import { extractChecks } from '../checks/extractChecks';
import { gradeDocument } from '../checks/gradeDocument';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { DocxSpec } from '../spec/DocxSpec';
import { loadFixture } from './loadFixture';

const SAMPLES = [
    { original: '21E_MachineLearning', raw: '21E_MachineLearning_RAW' },
    { original: 'Week2-Nummerierung-not-annotated', raw: 'Week2-Raw' },
    { original: 'ex01-what-is-programming', raw: 'ex01-what-is-programming-raw' }
];

const specOf = async (name: string): Promise<DocxSpec> => {
    const checks = extractChecks(await loadFixture(name), DEFAULT_EQUIVALENT_CHARACTERS);
    return { version: 1, source: `${name}.docx`, checks };
};

describe.each(SAMPLES)('$original', ({ original, raw }) => {
    it('passes all checks extracted from itself', async () => {
        const results = gradeDocument(await specOf(original), await loadFixture(original));

        expect(results.filter((result) => result.failures.length > 0)).toEqual([]);
    });

    it('fails the style and paragraph format checks with the unformatted document', async () => {
        const results = gradeDocument(await specOf(original), await loadFixture(raw));
        const failedKinds = new Set(
            results.filter((result) => result.failures.length > 0).map((result) => result.check.kind)
        );

        expect(failedKinds).toContain('paragraphFormat');
        expect(failedKinds).toContain('runFormat');
    });

    it('derives unique ids that are the same on every run', async () => {
        const ids = (await specOf(original)).checks.map((check) => check.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect((await specOf(original)).checks.map((check) => check.id)).toEqual(ids);
    });
});

describe('anchors', () => {
    it('point to the heading, not to its entry in the table of contents', async () => {
        const document = await loadFixture('21E_MachineLearning');
        const { findParagraph } = createAnchoring(document, createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS));

        expect(findParagraph({ text: 'Zielsetzung' })?.style.name).toBe('heading 1');
        expect(findParagraph({ text: 'Inhaltsverzeichnis' })).toBeUndefined();
    });
});

describe('gradeDocument', () => {
    it('reports a missing table of contents', async () => {
        const spec = await specOf('21E_MachineLearning');
        spec.checks = spec.checks.filter((check) => check.kind === 'field');

        const [result] = gradeDocument(spec, await loadFixture('21E_MachineLearning_RAW'));

        expect(result.failures).toEqual(['Inhaltsverzeichnis fehlt']);
    });

    it('reports changed text instead of failing silently', async () => {
        const spec = await specOf('21E_MachineLearning');
        spec.checks = spec.checks.filter((check) => check.kind === 'paragraphStyle');

        const results = gradeDocument(spec, await loadFixture('21E_MachineLearning_RAW'));

        expect(results[0].failures).toContain(
            '«Zielsetzung»: Formatvorlage «Standard» statt «Überschrift 1»'
        );
    });
});
