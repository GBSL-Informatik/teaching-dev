import { DocModel } from '../docx/DocModel';
import { DocxSpec } from '../spec/DocxSpec';
import { createAnchoring } from './anchors';
import { GradingContext } from './Check';
import { Check, evaluateCheck } from './kinds';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from './normalizeText';

export interface CheckResult {
    check: Check;
    /** Empty when the check passed. */
    failures: string[];
}

export const gradeDocument = (spec: DocxSpec, document: DocModel): CheckResult[] => {
    const equivalents = spec.equivalentCharacters ?? DEFAULT_EQUIVALENT_CHARACTERS;
    const normalize = createNormalizer(equivalents);
    const context: GradingContext = {
        document,
        normalize,
        equivalents,
        findParagraph: createAnchoring(document, normalize).findParagraph
    };
    return spec.checks.map((check) => ({ check, failures: evaluateCheck(check, context) }));
};
