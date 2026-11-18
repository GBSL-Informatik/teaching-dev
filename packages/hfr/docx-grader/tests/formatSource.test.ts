import { describe, expect, it } from 'vitest';
import { extractChecks } from '../checks/extractChecks';
import { gradeDocument } from '../checks/gradeDocument';
import { DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { DocModel } from '../docx/DocModel';
import { DocxSpec } from '../spec/DocxSpec';
import { docModelOf, normalStyle, paragraph } from './createDocx';
import { loadFixture } from './loadFixture';

const JUSTIFIED = '<w:jc w:val="both"/>';
const justifiedParagraph = (text: string) =>
    `<w:p><w:pPr>${JUSTIFIED}</w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;

const paragraphFormatSpec = (original: DocModel, defaultSource?: DocxSpec['defaultSource']): DocxSpec => {
    const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS);
    return {
        version: 1,
        source: 'original.docx',
        ...(defaultSource ? { defaultSource } : {}),
        // Without a styles part the document defaults differ from Word's too: only check the alignment.
        checks: checks.filter((check) => check.kind === 'paragraphFormat' && 'alignment' in check.expect)
    };
};

const failuresOf = (spec: DocxSpec, document: DocModel) => {
    return gradeDocument(spec, document).flatMap((result) => result.failures);
};

describe('format source', () => {
    it('requires formatting the original set through a style to come from the style', async () => {
        const original = await docModelOf(paragraph('Hallo'), normalStyle(JUSTIFIED));
        const spec = paragraphFormatSpec(original);

        expect(spec.checks[0]).toMatchObject({ source: 'style' });
        expect(failuresOf(spec, await docModelOf(paragraph('Hallo'), normalStyle(JUSTIFIED)))).toEqual([]);
        expect(failuresOf(spec, await docModelOf(justifiedParagraph('Hallo')))).toEqual([
            '«Hallo»: Ausrichtung: Blocksatz ist direkt formatiert statt über die Formatvorlage «Standard»'
        ]);
    });

    it('accepts direct formatting where the original used it, unless the spec requires styles', async () => {
        const original = await docModelOf(justifiedParagraph('Hallo'));
        const directlyFormatted = await docModelOf(justifiedParagraph('Hallo'));

        expect(paragraphFormatSpec(original).checks[0]).not.toHaveProperty('source');
        expect(failuresOf(paragraphFormatSpec(original), directlyFormatted)).toEqual([]);
        expect(failuresOf(paragraphFormatSpec(original, 'style'), directlyFormatted)).toHaveLength(1);
    });
});

describe('typed numbering', () => {
    it('finds a heading whose number was typed by hand and reports it', async () => {
        const original = await loadFixture('21E_MachineLearning');
        const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'numbering' && check.title.includes('«1»')
        );

        const results = gradeDocument(
            { version: 1, source: 'x.docx', checks },
            await docModelOf(paragraph('1 Begriffsklärung'))
        );

        expect(results[0].failures).toContain(
            '«Begriffsklärung»: von Hand eingetippt, verwende die automatische Nummerierung 1, 2, 3 «1», Ebene 1'
        );
    });
});
