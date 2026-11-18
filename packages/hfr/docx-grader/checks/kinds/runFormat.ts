import { Paragraph } from '../../docx/DocModel';
import { RunFormat } from '../../docx/formatting';
import { quote } from '../anchors';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { EquivalentCharacters, NormalizedChar, Normalizer, normalizeRuns } from '../normalizeText';
import { describeProperties, differences, mismatches, RUN_PROPERTIES } from '../properties';
import { anchoredParagraphs, baselineRunFormat, evaluateAnchors, groupBy } from './helpers';

export interface RunAnchor extends ParagraphAnchor {
    /** The formatted text within the paragraph; omitted when the whole paragraph is formatted. */
    segment?: string;
}

/** Characters look as in the original, e.g. a bold word or a paragraph set in another font. */
export interface RunFormatCheck extends CheckBase<'runFormat'> {
    anchors: RunAnchor[];
    expect: Partial<RunFormat>;
}

interface TextContext {
    normalize: Normalizer;
    equivalents: EquivalentCharacters;
}

interface Segment {
    text: string;
    expect: Partial<RunFormat>;
}

export const runFormat: CheckKind<RunFormatCheck> = {
    category: 'Zeichenformat',

    extract: (context) => {
        const segments = anchoredParagraphs(context).flatMap(({ paragraph, anchor }) => {
            const chars = authoredChars(paragraph, context);
            const baseline = baselineRunFormat(context, paragraph.style.name);
            const paragraphText = chars.map(({ char }) => char).join('');
            return formattedSegments(chars, baseline).map((segment) => ({
                anchor: segment.text === paragraphText ? anchor : { ...anchor, segment: segment.text },
                expect: segment.expect
            }));
        });

        return groupBy(segments, ({ expect }) => JSON.stringify(expect)).map((group) => {
            const { expect } = group[0];
            return {
                kind: 'runFormat',
                title: `Zeichenformat: ${describeProperties(expect, RUN_PROPERTIES)}`,
                anchors: group.map(({ anchor }) => anchor),
                expect
            };
        });
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph, anchor) => {
            const chars = authoredChars(paragraph, context);
            const text = chars.map(({ char }) => char).join('');
            // A segment occurring twice in the paragraph is checked at its first occurrence.
            const start = anchor.segment ? text.indexOf(anchor.segment) : 0;
            if (start < 0) {
                return [`Text ${quote(anchor.segment!)} nicht gefunden`];
            }
            const end = anchor.segment ? start + anchor.segment.length : text.length;
            const failures = chars
                .slice(start, end)
                .filter(({ char }) => char !== ' ')
                .flatMap(({ format }) => mismatches(check.expect, format, RUN_PROPERTIES));
            const location = anchor.segment ? `${quote(anchor.segment)}: ` : '';
            return [...new Set(failures)].map((failure) => `${location}${failure}`);
        });
    }
};

/** The characters of a paragraph, without the label and number of a caption, which the student adds. */
const authoredChars = (paragraph: Paragraph, context: TextContext): NormalizedChar[] => {
    const chars = normalizeRuns(paragraph.runs, context.equivalents);
    if (!paragraph.caption) {
        return chars;
    }
    const descriptionLength = context.normalize(paragraph.caption.description).length;
    return chars.slice(chars.length - descriptionLength);
};

/** Splits the characters into segments of equal formatting and keeps those differing from the baseline. */
const formattedSegments = (chars: NormalizedChar[], baseline: RunFormat): Segment[] => {
    const segments: (Segment & { key: string })[] = [];
    for (const { char, format } of chars) {
        const current = segments.at(-1);
        // Spaces join the segment they are in, so "two words" stays one segment.
        if (char === ' ' && current) {
            current.text += char;
            continue;
        }
        const expect = differences(format, baseline, RUN_PROPERTIES);
        const key = JSON.stringify(expect);
        if (current?.key === key) {
            current.text += char;
        } else {
            segments.push({ text: char, expect, key });
        }
    }
    return segments
        .map(({ text, expect }) => ({ text: text.trim(), expect }))
        .filter(({ text, expect }) => text && Object.keys(expect).length > 0);
};
