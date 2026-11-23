import { Paragraph } from '../../docx/DocModel';
import { ParagraphFormat, RunFormat } from '../../docx/formatting';
import { findStyleByName, resolveParagraph, resolveRun } from '../../docx/styleSheet';
import { quote } from '../anchors';
import { ExtractionContext, GradingContext, ParagraphAnchor } from '../Check';

const STYLE_LABELS: { [name: string]: string } = {
    Normal: 'Standard',
    Title: 'Titel',
    Subtitle: 'Untertitel',
    caption: 'Beschriftung',
    'List Paragraph': 'Listenabsatz',
    'No Spacing': 'Kein Leerraum',
    Quote: 'Zitat',
    'Intense Quote': 'Intensives Zitat',
    Bibliography: 'Literaturverzeichnis',
    'TOC Heading': 'Inhaltsverzeichnisüberschrift',
    'table of figures': 'Abbildungsverzeichnis',
    header: 'Kopfzeile',
    footer: 'Fusszeile'
};

/** The name Word shows for a style: built-in styles are stored with their English name. */
export const styleLabel = (name: string) => {
    const heading = name.match(/^heading (\d)$/);
    if (heading) {
        return `Überschrift ${heading[1]}`;
    }
    const toc = name.match(/^toc (\d)$/);
    if (toc) {
        return `Verzeichnis ${toc[1]}`;
    }
    return STYLE_LABELS[name] ?? name;
};

/** Groups items by a key, keeping the order in which each key first appears. */
export const groupBy = <T>(items: T[], keyOf: (item: T) => string): T[][] => {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const key = keyOf(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.values()];
};

/** Paragraphs with an anchor, paired with it. */
export const anchoredParagraphs = (context: ExtractionContext) => {
    return context.original.paragraphs.flatMap((paragraph) => {
        const anchor = context.anchorOf(paragraph);
        return anchor ? [{ paragraph, anchor }] : [];
    });
};

/** Word always stores a section for every paragraph; other programs may not. */
export const SECTION_NOT_FOUND = 'Abschnitt nicht gefunden – wurde das Dokument mit Word gespeichert?';

/** Anchor of the first anchored paragraph in a section, which identifies the section in other documents. */
export const sectionAnchor = (
    context: ExtractionContext,
    sectionIndex: number
): ParagraphAnchor | undefined => {
    return anchoredParagraphs(context).find(({ paragraph }) => paragraph.sectionIndex === sectionIndex)
        ?.anchor;
};

/** Evaluates every anchored paragraph and prefixes each failure with a quote of its text. */
export const evaluateAnchors = <A extends ParagraphAnchor>(
    anchors: A[],
    context: GradingContext,
    evaluate: (paragraph: Paragraph, anchor: A) => string[]
): string[] => {
    return anchors.flatMap((anchor) => {
        const paragraph = context.findParagraph(anchor);
        if (!paragraph) {
            return [`${quote(anchor.text)}: Absatz nicht gefunden – wurde der Text verändert?`];
        }
        return evaluate(paragraph, anchor).map((failure) => `${quote(anchor.text)}: ${failure}`);
    });
};

/** The paragraph format a style has in a blank document; custom styles fall back to `Normal`. */
export const baselineParagraphFormat = (context: ExtractionContext, styleName: string): ParagraphFormat => {
    const { styleSheet } = context.baseline;
    return resolveParagraph(styleSheet, findStyleByName(styleSheet, styleName)?.id, undefined).format;
};

export const baselineRunFormat = (context: ExtractionContext, styleName: string): RunFormat => {
    const { styleSheet } = context.baseline;
    return resolveRun(styleSheet, findStyleByName(styleSheet, styleName)?.id, undefined);
};
