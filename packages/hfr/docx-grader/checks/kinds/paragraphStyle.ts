import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { anchoredParagraphs, evaluateAnchors, groupBy, styleLabel } from './helpers';

/** The paragraphs use a style, e.g. `heading 1` so they appear in the table of contents. */
export interface ParagraphStyleCheck extends CheckBase<'paragraphStyle'> {
    anchors: ParagraphAnchor[];
    expect: { style: string };
}

export const paragraphStyle: CheckKind<ParagraphStyleCheck> = {
    category: 'Formatvorlagen',
    anchors: 'paragraph',

    extract: (context) => {
        // Captions are checked with their image.
        const styled = anchoredParagraphs(context).filter(
            ({ paragraph }) => paragraph.style.name !== 'Normal' && !paragraph.caption
        );
        return groupBy(styled, ({ paragraph }) => paragraph.style.name).map((group) => {
            const style = group[0].paragraph.style.name;
            return {
                kind: 'paragraphStyle',
                title: `Formatvorlage «${styleLabel(style)}»`,
                anchors: group.map(({ anchor }) => anchor),
                expect: { style }
            };
        });
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph) => {
            if (paragraph.style.name === check.expect.style) {
                return [];
            }
            return [
                `Formatvorlage «${styleLabel(paragraph.style.name)}» statt «${styleLabel(check.expect.style)}»`
            ];
        });
    }
};
