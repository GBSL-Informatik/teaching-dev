import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { extractChecks } from '../checks/extractChecks';
import { gradeDocument } from '../checks/gradeDocument';
import { DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';
import { createRawDocx } from '../raw/createRawDocx';
import { docxOf, paragraph } from './createDocx';
import { loadFixture, readFixture } from './loadFixture';

const SAMPLES = ['21E_MachineLearning', 'Week2-Nummerierung-not-annotated', 'ex01-what-is-programming'];

const rawModelOf = async (data: Uint8Array) =>
    buildDocModel(await readDocx((await createRawDocx(data)).data));
const rawDocumentXmlOf = async (data: Uint8Array) => {
    const zip = await JSZip.loadAsync((await createRawDocx(data)).data);
    return zip.file('word/document.xml')!.async('string');
};

describe.each(SAMPLES)('createRawDocx with %s', (name) => {
    it('removes all formatting', async () => {
        const raw = await rawModelOf(readFixture(name));

        expect(raw.sections).toHaveLength(1);
        expect(raw.sections[0].headersAndFooters).toEqual([]);
        expect(new Set(raw.paragraphs.map((p) => p.style.name))).toEqual(new Set(['Normal']));
        expect(raw.paragraphs.filter((p) => p.numbering || p.generatedBy || p.caption)).toEqual([]);
        expect(raw.fields).toEqual([]);
        expect(raw.autoHyphenation).toBe(false);
    });

    it('keeps every image, inline and 5 cm wide', async () => {
        const original = await loadFixture(name);
        const raw = await rawModelOf(readFixture(name));

        expect(raw.images).toHaveLength(original.images.length);
        expect(raw.images.every((image) => image.placement === 'inline' && image.widthCm === 5)).toBe(true);
    });

    it('keeps the text every check of the original anchors to', async () => {
        const checks = extractChecks(await loadFixture(name), DEFAULT_EQUIVALENT_CHARACTERS);
        const results = gradeDocument(
            { version: 1, source: `${name}.docx`, checks },
            await rawModelOf(readFixture(name))
        );

        const notFound = results
            .flatMap((result) => result.failures)
            .filter((f) => f.includes('nicht gefunden'));
        expect(notFound).toEqual([]);
    });
});

describe('createRawDocx', () => {
    it('ends table cells with a paragraph and keeps adjacent tables apart', async () => {
        const table = (content: string) => `<w:tbl><w:tr><w:tc>${content}</w:tc></w:tr></w:tbl>`;
        const nested = table(`${paragraph('outer')}${table(paragraph('inner'))}<w:p/>`);

        const xml = await rawDocumentXmlOf(await docxOf(`${nested}<w:p/>${table(paragraph('next'))}`));

        expect(xml).not.toContain('</w:tbl></w:tc>');
        expect(xml).not.toContain('</w:tbl><w:tbl>');
    });

    it('keeps tables with their merged cells, without formatting', async () => {
        const cell = (content: string, properties = '') =>
            `<w:tc><w:tcPr>${properties}</w:tcPr>${content}</w:tc>`;
        const table =
            '<w:tbl><w:tblPr><w:tblStyle w:val="Tabellenraster"/></w:tblPr>' +
            `<w:tr>${cell(paragraph('Kopf'), '<w:gridSpan w:val="2"/>')}</w:tr>` +
            `<w:tr>${cell(paragraph('a'))}${cell(paragraph('b'))}</w:tr></w:tbl>`;

        const raw = await rawModelOf(await docxOf(table));

        expect(raw.blocks).toEqual([
            {
                type: 'table',
                rows: [
                    [{ blocks: [{ type: 'paragraph', paragraphIndex: 0 }], gridSpan: 2 }],
                    [
                        { blocks: [{ type: 'paragraph', paragraphIndex: 1 }], gridSpan: 1 },
                        { blocks: [{ type: 'paragraph', paragraphIndex: 2 }], gridSpan: 1 }
                    ]
                ]
            }
        ]);
        expect(raw.paragraphs.map((p) => p.text)).toEqual(['Kopf', 'a', 'b']);
    });
});
