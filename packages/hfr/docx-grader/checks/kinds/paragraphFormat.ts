import { ParagraphFormat } from '../../docx/formatting';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { FormatSource, sourceMismatches, splitBySource } from '../formatSource';
import { describeProperties, differences, PARAGRAPH_PROPERTIES } from '../properties';
import { anchoredParagraphs, baselineParagraphFormat, evaluateAnchors, groupBy, styleLabel } from './helpers';

/**
 * The paragraphs look as in the original: only the properties that differ from the blank
 * document are expected. With `source: style`, they must come from the paragraph's style.
 */
export interface ParagraphFormatCheck extends CheckBase<'paragraphFormat'> {
    anchors: ParagraphAnchor[];
    expect: Partial<ParagraphFormat>;
    /** Set to `style` by the CLI when the original's style gives the expected properties. */
    source?: FormatSource;
}

export const paragraphFormat: CheckKind<ParagraphFormatCheck> = {
    category: 'Absatzformat',
    anchors: 'paragraph',

    extract: (context) => {
        const formatted = anchoredParagraphs(context).flatMap(({ paragraph, anchor }) => {
            const baseline = baselineParagraphFormat(context, paragraph.style.name);
            const expect = differences(paragraph.format, baseline, PARAGRAPH_PROPERTIES);
            return splitBySource(expect, [paragraph.styleFormat]).map((part) => ({
                style: paragraph.style.name,
                anchor,
                ...part
            }));
        });

        const groups = groupBy(formatted, ({ style, expect, source }) =>
            JSON.stringify([style, expect, source])
        );
        return groups.map((group) => {
            const { style, expect, source } = group[0];
            const viaStyle = source === 'style' ? ' (über die Formatvorlage)' : '';
            return {
                kind: 'paragraphFormat',
                title: `«${styleLabel(style)}»: ${describeProperties(expect, PARAGRAPH_PROPERTIES)}${viaStyle}`,
                anchors: group.map(({ anchor }) => anchor),
                expect,
                ...(source === 'style' ? { source } : {})
            };
        });
    },

    evaluate: (check, context) => {
        const source = check.source ?? context.defaultSource;
        return evaluateAnchors(check.anchors, context, (paragraph) => {
            const styleName = `die Formatvorlage «${styleLabel(paragraph.style.name)}»`;
            return sourceMismatches(check.expect, paragraph, source, PARAGRAPH_PROPERTIES, styleName);
        });
    }
};
