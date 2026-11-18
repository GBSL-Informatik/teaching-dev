import { createWordDefaultStyleSheet, WORD_DEFAULT_SECTION } from '../baseline/wordDefaults';
import { DocModel } from '../docx/DocModel';
import { createAnchoring } from './anchors';
import { CheckDraft, ExtractionContext } from './Check';
import { Check, CHECK_KINDS } from './kinds';
import { createNormalizer, EquivalentCharacters } from './normalizeText';

const MAX_ID_LENGTH = 80;

/** All formatting of the original document that differs from a blank document, as checks. */
export const extractChecks = (original: DocModel, equivalents: EquivalentCharacters): Check[] => {
    const normalize = createNormalizer(equivalents);
    const context: ExtractionContext = {
        original,
        baseline: {
            styleSheet: createWordDefaultStyleSheet(original.styleSheet.themeFonts),
            section: WORD_DEFAULT_SECTION
        },
        normalize,
        equivalents,
        anchorOf: createAnchoring(original, normalize).anchorOf
    };
    const drafts = Object.values(CHECK_KINDS).flatMap<CheckDraft<Check>>((kind) => kind.extract(context));
    return withUniqueIds(drafts);
};

/** Ids derive from kind and title, so re-running the CLI on the same document yields the same ids. */
const withUniqueIds = (drafts: CheckDraft<Check>[]): Check[] => {
    const usedIds = new Set<string>();
    return drafts.map((draft) => {
        const baseId = `${draft.kind}-${slug(draft.title)}`;
        let id = baseId;
        for (let suffix = 2; usedIds.has(id); suffix++) {
            id = `${baseId}-${suffix}`;
        }
        usedIds.add(id);
        return { id, ...draft };
    });
};

const slug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, MAX_ID_LENGTH)
        .replace(/^-|-$/g, '');
};
