import { Paragraph } from '../../docx/DocModel';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { anchoredParagraphs, evaluateAnchors, groupBy } from './helpers';

/** The paragraphs are part of a bulleted or numbered list. */
export interface NumberingCheck extends CheckBase<'numbering'> {
    anchors: ParagraphAnchor[];
    expect: {
        /** e.g. `bullet`, `decimal`, `lowerLetter` */
        format: string;
        /** Level, starting at 0. */
        level: number;
        /** Number pattern, e.g. `%1.%2`; not checked for bullets, whose symbol is free. */
        text?: string;
    };
}

const FORMAT_LABELS: { [format: string]: string } = {
    bullet: 'Aufzählungszeichen',
    decimal: 'Nummerierung 1, 2, 3',
    lowerLetter: 'Nummerierung a, b, c',
    upperLetter: 'Nummerierung A, B, C',
    lowerRoman: 'Nummerierung i, ii, iii',
    upperRoman: 'Nummerierung I, II, III'
};

export const numbering: CheckKind<NumberingCheck> = {
    category: 'Aufzählungen und Nummerierungen',
    anchors: 'paragraph',

    extract: (context) => {
        const numbered = anchoredParagraphs(context).flatMap(({ paragraph, anchor }) => {
            const expect = expectationOf(paragraph);
            return expect ? [{ anchor, expect }] : [];
        });
        return groupBy(numbered, ({ expect }) => JSON.stringify(expect)).map((group) => {
            const { expect } = group[0];
            return {
                kind: 'numbering',
                title: describe(expect),
                anchors: group.map(({ anchor }) => anchor),
                expect
            };
        });
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph) => {
            const actual = expectationOf(paragraph);
            if (!actual) {
                return [`keine Aufzählung oder Nummerierung, erwartet: ${describe(check.expect)}`];
            }
            const isSame =
                actual.format === check.expect.format &&
                actual.level === check.expect.level &&
                actual.text === check.expect.text;
            return isSame ? [] : [`${describe(actual)} statt ${describe(check.expect)}`];
        });
    }
};

const expectationOf = (paragraph: Paragraph): NumberingCheck['expect'] | undefined => {
    const { numbering } = paragraph;
    if (!numbering || numbering.format === 'none') {
        return undefined;
    }
    if (numbering.format === 'bullet') {
        return { format: numbering.format, level: numbering.level };
    }
    return { format: numbering.format, level: numbering.level, text: numbering.text };
};

const describe = (expect: NumberingCheck['expect']) => {
    const format = FORMAT_LABELS[expect.format] ?? expect.format;
    const pattern = expect.text ? ` «${expect.text.replace(/%\d/g, '1')}»` : '';
    return `${format}${pattern}, Ebene ${expect.level + 1}`;
};
