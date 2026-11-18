import { Field, FieldType } from './DocModel';

const BIBLIOGRAPHY = /^(BIBLIOGRAPHY|ADDIN (CSL_BIBLIOGRAPHY|ZOTERO_BIBL|EN\.REFLIST))\b/;
const CITATION = /^(CITATION|ADDIN (CSL_CITATION|ZOTERO_ITEM|EN\.CITE))\b/;

/** Fields whose result is generated content (e.g. table of contents entries), not text of the author. */
export const GENERATING_FIELDS: FieldType[] = ['tableOfContents', 'tableOfFigures', 'bibliography'];

export const parseField = (rawInstruction: string): Field => {
    const instruction = rawInstruction.replace(/\s+/g, ' ').trim();
    if (/^TOC\b/.test(instruction)) {
        const label = switchArgument(instruction, 'c') ?? switchArgument(instruction, 'a');
        return label
            ? { type: 'tableOfFigures', instruction, label }
            : { type: 'tableOfContents', instruction, levels: switchArgument(instruction, 'o') };
    }
    if (BIBLIOGRAPHY.test(instruction)) {
        return { type: 'bibliography', instruction };
    }
    if (CITATION.test(instruction)) {
        return { type: 'citation', instruction };
    }
    if (/^SEQ\b/.test(instruction)) {
        return { type: 'sequence', instruction, label: instruction.split(' ')[1] };
    }
    if (/^PAGE\b/.test(instruction)) {
        return { type: 'pageNumber', instruction };
    }
    if (/^(NUMPAGES|SECTIONPAGES)\b/.test(instruction)) {
        return { type: 'pageCount', instruction };
    }
    return { type: 'other', instruction };
};

/** Argument of a field switch, e.g. `Abbildung` for `\c "Abbildung"`. */
export const switchArgument = (instruction: string, name: string): string | undefined => {
    const match = instruction.match(new RegExp(`\\\\${name}\\s+(?:"([^"]*)"|(\\S+))`));
    return match ? (match[1] ?? match[2]) : undefined;
};
