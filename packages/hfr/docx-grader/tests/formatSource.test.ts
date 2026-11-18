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

describe('format source of characters and lists', () => {
    const STRONG_STYLE =
        '<w:style w:type="character" w:styleId="Fett"><w:name w:val="Strong"/><w:rPr><w:b/></w:rPr></w:style>';
    const run = (rPr: string, text: string) => `<w:r><w:rPr>${rPr}</w:rPr><w:t>${text}</w:t></w:r>`;
    const runFormatSpec = (original: DocModel): DocxSpec => ({
        version: 1,
        source: 'original.docx',
        checks: extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'runFormat' && 'bold' in check.expect
        )
    });

    it('requires a character style where the original used one', async () => {
        const body = (rPr: string) => `<w:p>${run('', 'Access ')}${run(rPr, 'granted')}</w:p>`;
        const spec = runFormatSpec(await docModelOf(body('<w:rStyle w:val="Fett"/>'), STRONG_STYLE));

        expect(failuresOf(spec, await docModelOf(body('<w:rStyle w:val="Fett"/>'), STRONG_STYLE))).toEqual(
            []
        );
        expect(failuresOf(spec, await docModelOf(body('<w:b/>'), STRONG_STYLE))).toEqual([
            '«Access granted»: «granted»: Fett: ja ist direkt formatiert statt über eine Formatvorlage'
        ]);
    });

    it('counts list indentation from directly applied numbering as direct formatting', async () => {
        const numbering =
            '<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>' +
            '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>' +
            '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>';
        const listItem =
            '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Punkt</w:t></w:r></w:p>';

        const checks = extractChecks(
            await docModelOf(listItem, undefined, numbering),
            DEFAULT_EQUIVALENT_CHARACTERS
        );
        const indentCheck = checks.find(
            (check) => check.kind === 'paragraphFormat' && 'indentLeftCm' in check.expect
        );

        expect(indentCheck).toBeDefined();
        expect(indentCheck).not.toHaveProperty('source');
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
