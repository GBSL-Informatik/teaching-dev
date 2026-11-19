import { describe, expect, it } from 'vitest';
import { createAnchoring } from '../checks/anchors';
import { extractChecks } from '../checks/extractChecks';
import { gradeDocument } from '../checks/gradeDocument';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { DocxSpec } from '../spec/DocxSpec';
import { docModelOf, paragraph } from './createDocx';
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
        const { checks } = await specOf(original);
        const ids = checks.map((check) => check.id);

        expect(new Set(ids).size).toBe(ids.length);
        // Numbered suffixes depend on the order of the checks: only equal titles may need them.
        const numbered = checks.filter((check) => ids.includes(`${check.id}-2`));
        numbered.forEach((check) => {
            expect(checks.find((other) => other.id === `${check.id}-2`)?.title).toBe(check.title);
        });
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

    it('compares expectations independently of their key order', async () => {
        const spec = await specOf('Week2-Nummerierung-not-annotated');
        spec.checks = [
            {
                id: 'tof',
                kind: 'field',
                title: 'Abbildungsverzeichnis',
                expect: { label: 'Abbildung', type: 'tableOfFigures' }
            }
        ];

        const [result] = gradeDocument(spec, await loadFixture('Week2-Nummerierung-not-annotated'));

        expect(result.failures).toEqual([]);
    });

    it('fails a check with broken expectations instead of stopping the grading', async () => {
        const spec = await specOf('ex01-what-is-programming');
        const broken = { id: 'broken', kind: 'image', title: 'Bild', anchors: [{ image: 0 }], expect: null };
        spec.checks = [broken as unknown as DocxSpec['checks'][number], ...spec.checks];

        const results = gradeDocument(spec, await loadFixture('ex01-what-is-programming'));

        expect(results[0].failures[0]).toMatch(/^Check konnte nicht ausgewertet werden/);
        expect(results.slice(1).every((result) => result.failures.length === 0)).toBe(true);
    });

    it('requires tabs where the original has them, not spaces', async () => {
        const spec = await specOf('ex01-what-is-programming');
        spec.checks = spec.checks.filter((check) => check.kind === 'tabs');

        // The teacher's raw document has spaces where the original has tabs.
        const [result] = gradeDocument(spec, await loadFixture('ex01-what-is-programming-raw'));

        expect(result.failures).toHaveLength(8);
        expect(result.failures[0]).toBe(
            '«➊ First, the file SecretPasswordFile.txt…»: Tabulator fehlt (0 statt 1), Leerzeichen ersetzen keinen Tabulator'
        );
    });

    it('ignores spaces next to a tab', async () => {
        const original = await docModelOf('<w:p><w:r><w:t>➊</w:t><w:tab/><w:t>First</w:t></w:r></w:p>');
        const spec: DocxSpec = {
            version: 1,
            source: 'x.docx',
            checks: extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS)
        };

        const results = gradeDocument(
            spec,
            await docModelOf(
                '<w:p><w:r><w:t xml:space="preserve">➊ </w:t><w:tab/><w:t>First</w:t></w:r></w:p>'
            )
        );
        const spaced = gradeDocument(spec, await docModelOf(paragraph('➊ First')));

        expect(results.find((result) => result.check.kind === 'tabs')?.failures).toEqual([]);
        expect(spaced.find((result) => result.check.kind === 'tabs')?.failures).toHaveLength(1);
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
