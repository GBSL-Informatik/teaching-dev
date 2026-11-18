import { DocModel, Paragraph, Section } from '../docx/DocModel';
import { StyleSheet } from '../docx/styleSheet';
import { EquivalentCharacters, Normalizer } from './normalizeText';

export interface CheckBase<Kind extends string> {
    /** Stable across re-runs of the CLI, so hints added to the spec are kept. */
    id: string;
    kind: Kind;
    title: string;
    /** Shown to the student when the check fails. */
    hint?: string;
    /** Link to a documentation page, shown when the check fails. */
    docs?: string;
}

/** Locates a paragraph by the start of its normalized text, which formatting does not change. */
export interface ParagraphAnchor {
    text: string;
    /** Index among the paragraphs starting with the same text; omitted for the first. */
    occurrence?: number;
}

export interface ExtractionContext {
    original: DocModel;
    baseline: {
        styleSheet: StyleSheet;
        section: Omit<Section, 'index' | 'headersAndFooters'>;
    };
    normalize: Normalizer;
    equivalents: EquivalentCharacters;
    /** Undefined for paragraphs that cannot be anchored, e.g. empty or generated ones. */
    anchorOf: (paragraph: Paragraph) => ParagraphAnchor | undefined;
}

export interface GradingContext {
    document: DocModel;
    normalize: Normalizer;
    equivalents: EquivalentCharacters;
    findParagraph: (anchor: ParagraphAnchor) => Paragraph | undefined;
}

/** A check without the id, which is assigned once all checks are extracted. */
export type CheckDraft<C extends CheckBase<string>> = C extends unknown ? Omit<C, 'id'> : never;

/** How checks of a kind locate their content: `paragraph` and `image` anchors, or the whole document. */
export type AnchorType = 'paragraph' | 'image' | 'none';

export interface CheckKind<C extends CheckBase<string>> {
    /** Groups checks in the CLI selection and in the results. */
    category: string;
    anchors: AnchorType;
    extract: (context: ExtractionContext) => CheckDraft<C>[];
    /** Returns one message per unmet expectation; none means the check passed. */
    evaluate: (check: C, context: GradingContext) => string[];
}
