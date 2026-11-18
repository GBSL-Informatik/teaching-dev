import { DocModel, Paragraph } from '../docx/DocModel';
import { ParagraphAnchor } from './Check';
import { Normalizer } from './normalizeText';

const ANCHOR_LENGTH = 60;
/** A number or bullet typed by hand at the start of a paragraph, e.g. `1.2 `, `a) ` or `- `. */
const TYPED_NUMBERING = /^(\d+(\.\d+)*\.?|[a-zA-Z]\)|[•·▪◦‣-])\s+/;

export const hasTypedNumbering = (normalizedText: string) => TYPED_NUMBERING.test(normalizedText);

/**
 * Anchors only point to paragraphs whose text the author wrote: generated paragraphs (e.g. the
 * table of contents repeating every heading) would otherwise be found first. Captions are anchored
 * by their description, as the label and number are added by the student. A paragraph whose
 * number was typed by hand is still found, so the numbering check can report it.
 */
export const createAnchoring = (document: DocModel, normalize: Normalizer) => {
    const anchorTextOf = (paragraph: Paragraph) => {
        if (paragraph.generatedBy) {
            return '';
        }
        return normalize(paragraph.caption?.description ?? paragraph.text).slice(0, ANCHOR_LENGTH);
    };

    // Indexes all paragraphs, so occurrences count the same as in `paragraphsByText`.
    const textWithoutTypedNumberOf = (paragraph: Paragraph) => {
        const text = normalize(paragraph.text);
        if (paragraph.generatedBy || paragraph.caption || !hasTypedNumbering(text)) {
            return anchorTextOf(paragraph);
        }
        return text.replace(TYPED_NUMBERING, '').slice(0, ANCHOR_LENGTH);
    };

    const paragraphsByText = indexBy(document.paragraphs, anchorTextOf);
    const paragraphsByTextWithoutTypedNumber = indexBy(document.paragraphs, textWithoutTypedNumberOf);

    const anchorOf = (paragraph: Paragraph): ParagraphAnchor | undefined => {
        const text = anchorTextOf(paragraph);
        if (!text) {
            return undefined;
        }
        const occurrence = paragraphsByText.get(text)!.indexOf(paragraph);
        return occurrence > 0 ? { text, occurrence } : { text };
    };

    const findParagraph = (anchor: ParagraphAnchor): Paragraph | undefined => {
        const occurrence = anchor.occurrence ?? 0;
        return (
            paragraphsByText.get(anchor.text)?.[occurrence] ??
            paragraphsByTextWithoutTypedNumber.get(anchor.text)?.[occurrence]
        );
    };

    return { anchorOf, findParagraph };
};

const indexBy = (paragraphs: Paragraph[], textOf: (paragraph: Paragraph) => string) => {
    const index = new Map<string, Paragraph[]>();
    for (const paragraph of paragraphs) {
        const text = textOf(paragraph);
        if (text) {
            index.set(text, [...(index.get(text) ?? []), paragraph]);
        }
    }
    return index;
};

/** A short quote of the anchored text for messages. */
export const quote = (text: string, maxLength = 40) => {
    return text.length > maxLength ? `«${text.slice(0, maxLength)}…»` : `«${text}»`;
};
