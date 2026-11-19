import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID
} from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { describe, expect, it } from 'vitest';
import { annotationsOf } from '../annotate/annotationsOf';
import { excalidrawScene, LABEL_COLOR, NOTES_COLOR } from '../annotate/excalidrawScene';
import { layoutPage } from '../annotate/layoutPage';
import { compactText, createTextLocator } from '../annotate/locateText';
import { PdfPage, PdfText } from '../annotate/readPdf';
import { extractChecks } from '../checks/extractChecks';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { docModelOf, paragraph, picture } from './createDocx';
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

    it('locates the first line of a paragraph up to its end in the column, and the end of the whole line', () => {
        const columnText = (str: string, x: number, y: number) => ({ ...line(str, y), x });
        const locator = createTextLocator([
            pageOf([
                columnText('Television', 70, 100),
                columnText('shows', 125, 100),
                columnText('and films', 70, 112),
                columnText('Programming', 300, 100)
            ])
        ]);

        expect(locator.locateLine('Television')).toMatchObject({ x: 70, width: 80, lineRight: 355 });
        expect(locator.locate('Television')).toMatchObject({ x: 70, width: 50, lineRight: 355 });
    });
});

describe('annotationsOf', () => {
    it('points to the heading, not to its entry in the table of contents before it', async () => {
        const original = await loadFixture('21E_MachineLearning');
        const normalize = createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS);
        const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'paragraphStyle' && check.expect.style === 'heading 1'
        );
        const pages = [pageOf([line('1 Begriffsklärung 1', 100), line('Begriffsklärung', 500)])];

        const annotations = annotationsOf(checks, original, pages, normalize);

        expect(annotations).toEqual([
            { label: '«Überschrift 1»', target: expect.objectContaining({ y: 500 }) }
        ]);
    });

    it('ignores running heads that repeat a heading in the header', async () => {
        const original = await loadFixture('21E_MachineLearning');
        const normalize = createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS);
        const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'paragraphStyle' && check.expect.style === 'heading 1'
        );
        const runningHead = line('Begriffsklärung', 30);
        const pages = [pageOf([runningHead, line('1 Begriffsklärung 1', 100), line('Begriffsklärung', 500)])];

        const [annotation] = annotationsOf(checks, original, pages, normalize);

        expect(annotation.target).toMatchObject({ y: 500 });
    });
    it('points to the caption, not to the same text before it, e.g. in the list of figures', async () => {
        const captionStyle =
            '<w:style w:type="paragraph" w:styleId="Beschriftung"><w:name w:val="caption"/></w:style>';
        const original = await docModelOf(
            paragraph('Methodenauswahl') +
                `<w:p>${picture(5)}</w:p>` +
                '<w:p><w:pPr><w:pStyle w:val="Beschriftung"/></w:pPr><w:r><w:t>Methodenauswahl</w:t></w:r></w:p>',
            captionStyle
        );
        const normalize = createNormalizer(DEFAULT_EQUIVALENT_CHARACTERS);
        const checks = extractChecks(original, DEFAULT_EQUIVALENT_CHARACTERS).filter(
            (check) => check.kind === 'image'
        );
        const pages = [pageOf([line('Methodenauswahl', 100), line('Methodenauswahl', 500)])];

        const [annotation] = annotationsOf(checks, original, pages, normalize);

        expect(annotation.target).toMatchObject({ y: 500 });
    });
});

describe('excalidrawScene', () => {
    it('uses the page as the background image of the markup editor and adds editable labels', () => {
        const layout = layoutPage(pageOf([]), [
            { label: 'Titel', target: { page: 0, x: 70, y: 100, width: 50, height: 11, lineRight: 120 } },
            { label: 'Automatische Silbentrennung' }
        ]);
        const page = { data: Buffer.from('webp'), mimeType: 'image/webp', extension: '.webp' };

        const scene = excalidrawScene(layout, page);

        expect(scene.elements.map((element) => element.id)).toEqual([
            EXCALIDRAW_BACKGROUND_IMAGE_ID,
            EXCALIDRAW_IMAGE_RECTANGLE_ID,
            'docx-grader-label-0',
            'docx-grader-arrow-0',
            'docx-grader-notes'
        ]);
        const [background, , label, arrow, notes] = scene.elements;
        expect(background).toMatchObject({
            width: 800,
            height: (842 * 800) / 595,
            customData: { exportFormatMimeType: 'image/webp', initExtension: '.webp' }
        });
        expect(scene.files?.[EXCALIDRAW_BACKGROUND_FILE_ID]?.dataURL).toBe('data:image/webp;base64,d2VicA==');
        expect(label).toMatchObject({ fontFamily: 6, strokeColor: LABEL_COLOR });
        expect(arrow).toMatchObject({ roughness: 0, endArrowhead: 'triangle_outline' });
        expect(notes).toMatchObject({ text: '• Automatische Silbentrennung', strokeColor: NOTES_COLOR });
    });
});

describe('layoutPage', () => {
    it('stacks labels without overlap, even for targets on the same line', () => {
        const target = { page: 0, x: 70, y: 100, width: 50, height: 11, lineRight: 120 };
        const { labels } = layoutPage(pageOf([]), [
            { label: 'Ausrichtung: Blocksatz', target },
            { label: 'Schriftart: Consolas', target: { ...target, x: 200 } }
        ]);

        expect(labels[1].y).toBeGreaterThanOrEqual(labels[0].y + labels[0].height);
    });

    it('routes arrows through the right margin and frames text that does not end its line', () => {
        const justified = line('A justified line that reaches the right margin', 300);
        const page = pageOf([justified]);
        const scale = 800 / 595;
        const segment = { page: 0, x: 100, y: 100, width: 50, height: 11, lineRight: 200 };

        const [label] = layoutPage(page, [{ label: 'Fett: ja', target: segment }]).labels;

        const marginX = (justified.x + justified.width) * scale + 6;
        expect(label.arrow.slice(1)).toEqual([
            [marginX, (100 + 11 * 0.2 + 5.5) * scale],
            [200 * scale + 6, (100 + 11 * 0.2 + 5.5) * scale]
        ]);
        expect(label.marker).toMatchObject({ x: 100 * scale - 2, width: 50 * scale + 4 });
    });

    it('lists annotations without a place at the top left of the page', () => {
        const { labels, notes } = layoutPage(pageOf([]), [
            { label: 'Automatische Silbentrennung' },
            { label: 'Inhaltsverzeichnis (Ebenen 1-3)' }
        ]);

        expect(labels).toEqual([]);
        expect(notes).toMatchObject({
            x: 16,
            y: 12,
            lines: ['• Automatische Silbentrennung', '• Inhaltsverzeichnis (Ebenen 1-3)']
        });
    });
});
