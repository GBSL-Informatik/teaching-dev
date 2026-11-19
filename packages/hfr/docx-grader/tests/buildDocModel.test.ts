import { describe, expect, it } from 'vitest';
import { readDocx } from '../docx/readDocx';
import { loadFixture } from './loadFixture';

describe('readDocx', () => {
    it('rejects a file that is not a docx', async () => {
        await expect(readDocx(new TextEncoder().encode('Hallo'))).rejects.toThrow(
            'Die Datei ist kein Word-Dokument (.docx).'
        );
    });
});

describe('buildDocModel', () => {
    it('resolves paragraph formatting through styles, numbering and direct formatting', async () => {
        const document = await loadFixture('21E_MachineLearning');
        const heading = document.paragraphs.find((paragraph) => paragraph.text === 'Begriffsklärung')!;

        expect(heading.style.name).toBe('heading 1');
        expect(heading.numbering).toEqual({ level: 0, format: 'decimal', text: '%1' });
        expect(heading.format.lineSpacing).toEqual({ rule: 'multiple', value: 1.5 });
        expect(heading.runs[0].format).toMatchObject({ font: 'Arial', sizePt: 16 });
    });

    it('marks the table of contents, including its heading, as generated', async () => {
        const document = await loadFixture('21E_MachineLearning');
        const generated = document.paragraphs.filter((paragraph) => paragraph.generatedBy);

        expect(generated.map((paragraph) => paragraph.text)).toContain('Inhaltsverzeichnis');
        expect(generated.every((paragraph) => paragraph.generatedBy === 'tableOfContents')).toBe(true);
        expect(document.fields.find((field) => field.type === 'tableOfContents')?.levels).toBe('1-3');
    });

    it('splits captions into label and description, even when the SEQ instruction is split', async () => {
        const document = await loadFixture('21E_MachineLearning');

        // The second caption's instruction is stored as «SEQ Abbildun» + «g \* ARABIC».
        expect(document.images[2].caption).toEqual({
            label: 'Abbildung',
            description: expect.stringMatching(/^Schematische Darstellung eines künstlichen Neurons/)
        });
    });

    it('reads anchored images with their wrapping and the caption of a text box', async () => {
        const document = await loadFixture('21E_MachineLearning');
        const [anchored] = document.images;

        expect(anchored).toMatchObject({ placement: 'anchored', wrap: 'square', widthCm: 15.46 });
        expect(anchored.caption?.description).toMatch(/^In diesem Beitrag werden die Grundprinzipien/);
    });

    it('reads sections with columns, page numbers and inherited headers and footers', async () => {
        const document = await loadFixture('ex01-what-is-programming');
        const [first, second, third] = document.sections;

        expect(second).toMatchObject({ breakType: 'continuous', columns: { count: 3, spacingCm: 0.87 } });
        expect(third.headersAndFooters).toEqual(first.headersAndFooters);
        const header = first.headersAndFooters.find(
            (part) => part.kind === 'header' && part.variant === 'default'
        );
        expect(header?.paragraphs.map((paragraph) => paragraph.text)).toEqual(['OF Informatik']);
        expect(document.autoHyphenation).toBe(true);
    });

    it('keeps the result of a page number field apart from the text', async () => {
        const document = await loadFixture('21E_MachineLearning');
        const footer = document.sections[0].headersAndFooters.find((part) => part.variant === 'default')!;
        const runs = footer.paragraphs.flatMap((paragraph) => paragraph.runs);

        expect(runs.every((run) => run.field === 'pageNumber')).toBe(true);
    });
});
