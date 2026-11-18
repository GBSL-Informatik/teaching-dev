import { ParagraphFormat } from '../../docx/formatting';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { describeProperties, differences, mismatches, PARAGRAPH_PROPERTIES } from '../properties';
import { anchoredParagraphs, baselineParagraphFormat, evaluateAnchors, groupBy, styleLabel } from './helpers';

/**
 * The paragraphs look as in the original: only the properties that differ from the blank
 * document are expected, whether the student sets them directly or through a style.
 */
export interface ParagraphFormatCheck extends CheckBase<'paragraphFormat'> {
    anchors: ParagraphAnchor[];
    expect: Partial<ParagraphFormat>;
}

export const paragraphFormat: CheckKind<ParagraphFormatCheck> = {
    category: 'Absatzformat',

    extract: (context) => {
        const formatted = anchoredParagraphs(context)
            .map(({ paragraph, anchor }) => {
                const baseline = baselineParagraphFormat(context, paragraph.style.name);
                const expect = differences(paragraph.format, baseline, PARAGRAPH_PROPERTIES);
                return { style: paragraph.style.name, anchor, expect };
            })
            .filter(({ expect }) => Object.keys(expect).length > 0);

        const groups = groupBy(formatted, ({ style, expect }) => JSON.stringify([style, expect]));
        return groups.map((group) => {
            const { style, expect } = group[0];
            return {
                kind: 'paragraphFormat',
                title: `«${styleLabel(style)}»: ${describeProperties(expect, PARAGRAPH_PROPERTIES)}`,
                anchors: group.map(({ anchor }) => anchor),
                expect
            };
        });
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph) =>
            mismatches(check.expect, paragraph.format, PARAGRAPH_PROPERTIES)
        );
    }
};
