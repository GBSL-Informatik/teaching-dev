import { DocModel, Paragraph } from '../docx/DocModel';
import { ParagraphAnchor } from './Check';
import { Normalizer } from './normalizeText';

const ANCHOR_LENGTH = 60;

/**
 * Anchors only point to paragraphs whose text the author wrote: generated paragraphs (e.g. the
 * table of contents repeating every heading) would otherwise be found first. Captions are anchored
 * by their description, as the label and number are added by the student.
 */
export const createAnchoring = (document: DocModel, normalize: Normalizer) => {
    const anchorTextOf = (paragraph: Paragraph) => {
        if (paragraph.generatedBy) {
            return '';
        }
        return normalize(paragraph.caption?.description ?? paragraph.text).slice(0, ANCHOR_LENGTH);
    };

    const paragraphsByText = new Map<string, Paragraph[]>();
    for (const paragraph of document.paragraphs) {
        const text = anchorTextOf(paragraph);
        if (text) {
            paragraphsByText.set(text, [...(paragraphsByText.get(text) ?? []), paragraph]);
        }
    }

    const anchorOf = (paragraph: Paragraph): ParagraphAnchor | undefined => {
        const text = anchorTextOf(paragraph);
        if (!text) {
            return undefined;
        }
        const occurrence = paragraphsByText.get(text)!.indexOf(paragraph);
        return occurrence > 0 ? { text, occurrence } : { text };
    };

    const findParagraph = (anchor: ParagraphAnchor): Paragraph | undefined => {
        return paragraphsByText.get(anchor.text)?.[anchor.occurrence ?? 0];
    };

    return { anchorOf, findParagraph };
};

/** A short quote of the anchored text for messages. */
export const quote = (text: string, maxLength = 40) => {
    return text.length > maxLength ? `«${text.slice(0, maxLength)}…»` : `«${text}»`;
};
