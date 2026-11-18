import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { Normalizer } from '../normalizeText';
import { anchoredParagraphs, evaluateAnchors } from './helpers';

export interface TabAnchor extends ParagraphAnchor {
    /** The normalized text with its tabs, e.g. `➊\tFirst, the file…`. */
    tabbed: string;
}

/**
 * The paragraphs use tabs where the original does. Anchors treat a tab like a space, so the
 * paragraph is found when a student typed spaces instead; this check tells them apart.
 */
export interface TabsCheck extends CheckBase<'tabs'> {
    anchors: TabAnchor[];
    expect: { useTabs: true };
}

export const tabs: CheckKind<TabsCheck> = {
    category: 'Tabulatoren',
    anchors: 'paragraph',

    extract: (context) => {
        const tabbed = anchoredParagraphs(context)
            .filter(({ paragraph }) => paragraph.text.includes('\t'))
            .map(({ paragraph, anchor }) => ({
                ...anchor,
                tabbed: tabbedText(paragraph.text, context.normalize)
            }));
        if (tabbed.length === 0) {
            return [];
        }
        return [
            {
                kind: 'tabs',
                title: 'Tabulatoren statt Leerzeichen',
                anchors: tabbed,
                expect: { useTabs: true }
            }
        ];
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph, anchor) => {
            const actual = tabbedText(paragraph.text, context.normalize);
            if (actual === anchor.tabbed) {
                return [];
            }
            const actualCount = tabCount(actual);
            const expectedCount = tabCount(anchor.tabbed);
            if (actualCount < expectedCount) {
                return [
                    `Tabulator fehlt (${actualCount} statt ${expectedCount}), Leerzeichen ersetzen keinen Tabulator`
                ];
            }
            if (actualCount > expectedCount) {
                return [`zu viele Tabulatoren (${actualCount} statt ${expectedCount})`];
            }
            return ['Tabulatoren an anderer Stelle als im Original'];
        });
    }
};

/** Each part between tabs is normalized, so spaces next to a tab do not count. */
const tabbedText = (text: string, normalize: Normalizer) => {
    return text.split('\t').map(normalize).join('\t');
};

const tabCount = (text: string) => text.split('\t').length - 1;
