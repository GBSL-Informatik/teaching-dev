import { createWordDefaultStyleSheet, WORD_DEFAULT_SECTION } from '../baseline/wordDefaults';
import { DocModel } from '../docx/DocModel';
import { createAnchoring } from './anchors';
import { CheckDraft, ExtractionContext } from './Check';
import { Check, CHECK_KINDS } from './kinds';
import { createNormalizer, EquivalentCharacters } from './normalizeText';

const MAX_SLUG_LENGTH = 60;

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

/**
 * Ids derive from kind and title, so re-running the CLI on the same document yields the same ids.
 * Only checks with the same title get a numbered suffix, in document order.
 */
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

/** A readable slug; long titles are shortened and get a hash of the full title to stay distinct. */
const slug = (text: string) => {
    const full = text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    if (full.length <= MAX_SLUG_LENGTH) {
        return full;
    }
    return `${full.slice(0, MAX_SLUG_LENGTH).replace(/-$/, '')}-${hash(text)}`;
};

/** FNV-1a, as 6 hex digits. */
const hash = (text: string) => {
    let value = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        value = Math.imul(value ^ text.charCodeAt(i), 0x01000193);
    }
    return (value >>> 0).toString(16).padStart(8, '0').slice(0, 6);
};
