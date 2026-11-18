import { createAnchoring } from '../checks/anchors';
import { ParagraphAnchor } from '../checks/Check';
import { Check } from '../checks/kinds';
import { RunAnchor } from '../checks/kinds/runFormat';
import { Normalizer } from '../checks/normalizeText';
import { DocModel, Paragraph } from '../docx/DocModel';
import { compactText, createTextLocator, TextBox } from './locateText';

export interface Annotation {
    label: string;
    /** Where the label points to; annotations without one are listed on the first page. */
    target?: TextBox;
}

type Locator = ReturnType<typeof createTextLocator>;

/**
 * One annotation per check and page, pointing to the first place the check applies to there.
 * Annotations of the same place are merged, so each place gets one label and one arrow.
 */
export const annotationsOf = (
    checks: Check[],
    original: DocModel,
    locator: Locator,
    normalize: Normalizer
): Annotation[] => {
    return mergeByTarget(annotationsPerCheck(checks, original, locator, normalize));
};

const annotationsPerCheck = (
    checks: Check[],
    original: DocModel,
    locator: Locator,
    normalize: Normalizer
): Annotation[] => {
    const { findParagraph } = createAnchoring(original, normalize);
    const locateAnchor = (anchor: ParagraphAnchor & Partial<RunAnchor>) => {
        const paragraph = findParagraph(anchor);
        if (!paragraph) {
            return undefined;
        }
        const text = anchor.segment ?? anchor.text;
        return locator.locate(text, occurrencesBefore(original, paragraph, text));
    };

    return checks.flatMap((check) => {
        const label = labelOf(check);
        if (check.kind === 'headerFooter') {
            return [{ label, target: check.expect.text ? locator.locate(check.expect.text) : undefined }];
        }
        if (check.kind === 'image') {
            const caption = check.expect.caption?.text;
            return [{ label, target: caption ? locator.locate(caption) : undefined }];
        }
        if (!('anchors' in check)) {
            return [{ label }];
        }
        const targets = check.anchors.map(locateAnchor).filter((target) => target !== undefined);
        return firstPerPage(targets).map((target) => ({ label, target }));
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
        .filter((before) => compactText(before.text).includes(key)).length;
};

const mergeByTarget = (annotations: Annotation[]): Annotation[] => {
    const merged = new Map<string, Annotation>();
    annotations.forEach((annotation, index) => {
        const { target } = annotation;
        const key = target
            ? `${target.page}:${Math.round(target.x)}:${Math.round(target.y)}`
            : `none:${index}`;
        const existing = merged.get(key);
        merged.set(
            key,
            existing ? { ...existing, label: `${existing.label}\n${annotation.label}` } : annotation
        );
    });
    return [...merged.values()];
};

const firstPerPage = (targets: TextBox[]): TextBox[] => {
    const pages = new Set<number>();
    return targets.filter((target) => {
        if (pages.has(target.page)) {
            return false;
        }
        pages.add(target.page);
        return true;
    });
};

/** Titles describe the expectation; anchors quoted in them are redundant next to an arrow. */
const labelOf = (check: Check) => {
    return check.title
        .replace(/^Abschnitt ab «[^»]*»: /, 'Abschnitt: ')
        .replace(/^Formatvorlage /, '')
        .replace(/^Zeichenformat: /, '');
};
