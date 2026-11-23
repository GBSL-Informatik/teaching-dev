import { createAnchoring } from '../checks/anchors';
import { ParagraphAnchor } from '../checks/Check';
import { Check } from '../checks/kinds';
import { styleLabel } from '../checks/kinds/helpers';
import { ImageAnchor } from '../checks/kinds/image';
import { describeParagraphFormat } from '../checks/kinds/paragraphFormat';
import { describeRunFormat, RunAnchor } from '../checks/kinds/runFormat';
import { describeSection } from '../checks/kinds/section';
import { Normalizer } from '../checks/normalizeText';
import { DocModel, Paragraph } from '../docx/DocModel';
import { compactText, createTextLocator, TextBox } from './locateText';
import { PdfPage, PdfText } from './readPdf';

export interface Annotation {
    label: string;
    /** Where the label points to; annotations without one are listed on the first page. */
    target?: TextBox;
    /** The annotation is about the whole paragraph the target is the first line of. */
    isParagraph?: boolean;
}

type Locator = ReturnType<typeof createTextLocator>;

const POINTS_PER_CM = 72 / 2.54;

/**
 * One annotation per check and page, pointing to the first place the check applies to there.
 * Annotations of the same text are merged, so each framed value or line gets one label and one arrow.
 */
export const annotationsOf = (
    checks: Check[],
    original: DocModel,
    pages: PdfPage[],
    normalize: Normalizer
): Annotation[] => {
    const isBody = isInBody(original);
    const locators = {
        body: createTextLocator(pages, isBody),
        headerFooter: createTextLocator(pages, (text, page) => !isBody(text, page))
    };
    return mergeByTarget(annotationsPerCheck(checks, original, locators, normalize));
};

/**
 * Headers and footers repeat on every page, e.g. a running head with the current heading: leaving
 * them out keeps occurrences in the PDF in step with those in the document. Without Word's tags, the
 * margins of the first section tell them apart, although later sections may have other margins.
 */
const isInBody = (original: DocModel) => (text: PdfText, page: PdfPage) => {
    if (page.isTagged) {
        return !text.isArtifact;
    }
    const margins = original.sections[0]?.marginsCm;
    if (!margins) {
        return true;
    }
    // Compares baselines, the bottom of pdf.js' boxes: a footer's box can reach across the margin.
    const baseline = text.y + text.height;
    const isInHeader = baseline <= margins.top * POINTS_PER_CM;
    const isInFooter = baseline >= page.heightPt - margins.bottom * POINTS_PER_CM;
    return !isInHeader && !isInFooter;
};

const annotationsPerCheck = (
    checks: Check[],
    original: DocModel,
    locators: { body: Locator; headerFooter: Locator },
    normalize: Normalizer
): Annotation[] => {
    const { findParagraph } = createAnchoring(original, normalize);
    const locateAnchor = (anchor: ParagraphAnchor & Partial<RunAnchor>) => {
        const paragraph = findParagraph(anchor);
        if (!paragraph) {
            return undefined;
        }
        if (anchor.segment) {
            return locators.body.locate(
                anchor.segment,
                occurrencesBefore(original, paragraph, anchor.segment)
            );
        }
        return locators.body.locateLine(anchor.text, occurrencesBefore(original, paragraph, anchor.text));
    };
    const locateCaption = (anchor: ImageAnchor) => {
        const caption = original.images[anchor.image]?.caption;
        if (!caption) {
            return undefined;
        }
        const { description, paragraphIndex } = caption;
        const paragraph = original.paragraphs[paragraphIndex];
        return locators.body.locateLine(description, occurrencesBefore(original, paragraph, description));
    };

    return checks.flatMap((check) => {
        const label = labelOf(check);
        if (check.kind === 'headerFooter') {
            const target = check.expect.text ? locators.headerFooter.locate(check.expect.text) : undefined;
            return [{ label, target }];
        }
        if (check.kind === 'image') {
            return check.anchors.map((anchor) => ({ label, target: locateCaption(anchor) }));
        }
        if (!('anchors' in check)) {
            return [{ label }];
        }
        const annotations = check.anchors.map((anchor) => ({
            label,
            target: locateAnchor(anchor),
            isParagraph: !('segment' in anchor && anchor.segment)
        }));
        return firstPerPage(annotations.filter((annotation) => annotation.target));
    });
};

/**
 * The PDF also contains generated text, e.g. the table of contents repeating every heading: count
 * how often the text appears in the document before the anchored paragraph.
 */
const occurrencesBefore = (document: DocModel, paragraph: Paragraph, text: string) => {
    const key = compactText(text);
    return document.paragraphs
        .slice(0, paragraph.index)
        .reduce((count, before) => count + compactText(before.text).split(key).length - 1, 0);
};

const mergeByTarget = (annotations: Annotation[]): Annotation[] => {
    const merged = new Map<string, Annotation>();
    annotations.forEach((annotation, index) => {
        const { target } = annotation;
        // Paragraph annotations are drawn differently, so they keep their own label.
        const key = target
            ? `${target.page}:${Math.round(target.x)}:${Math.round(target.y)}:${Math.round(target.width)}:${annotation.isParagraph}`
            : `none:${index}`;
        const existing = merged.get(key);
        merged.set(
            key,
            existing ? { ...existing, label: `${existing.label}\n${annotation.label}` } : annotation
        );
    });
    return [...merged.values()];
};

const firstPerPage = (annotations: Annotation[]): Annotation[] => {
    const pages = new Set<number>();
    return annotations.filter(({ target }) => {
        if (pages.has(target!.page)) {
            return false;
        }
        pages.add(target!.page);
        return true;
    });
};

/**
 * The check's title without what the arrow already shows: the anchored text, and the style a
 * paragraph format is for, which the paragraph style's label names, e.g. «Überschrift 1».
 */
const labelOf = (check: Check) => {
    switch (check.kind) {
        case 'paragraphStyle':
            return `«${styleLabel(check.expect.style)}»`;
        case 'paragraphFormat':
            return describeParagraphFormat(check.expect, check.source);
        case 'runFormat':
            return describeRunFormat(check.expect, check.source);
        case 'section':
            return `Abschnitt: ${describeSection(check.expect)}`;
        default:
            return check.title;
    }
};
