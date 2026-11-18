import { buildDocModel } from '../docx/buildDocModel';
import { DocModel } from '../docx/DocModel';
import { readDocx } from '../docx/readDocx';
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

/** Grades the bytes of an uploaded `.docx` file. */
export const gradeDocx = async (spec: DocxSpec, data: ArrayBuffer | Uint8Array): Promise<CheckResult[]> => {
    return gradeDocument(spec, buildDocModel(await readDocx(data)));
};

export const gradeDocument = (spec: DocxSpec, document: DocModel): CheckResult[] => {
    const equivalents = spec.equivalentCharacters ?? DEFAULT_EQUIVALENT_CHARACTERS;
    const normalize = createNormalizer(equivalents);
    const context: GradingContext = {
        document,
        normalize,
        equivalents,
        findParagraph: createAnchoring(document, normalize).findParagraph
    };
    return spec.checks.map((check) => ({ check, failures: evaluateSafely(check, context) }));
};

/** Specs are edited by hand: a check with unexpected values fails instead of stopping the grading. */
const evaluateSafely = (check: Check, context: GradingContext): string[] => {
    try {
        return evaluateCheck(check, context);
    } catch (error) {
        return [`Check konnte nicht ausgewertet werden: ${error instanceof Error ? error.message : error}`];
    }
};
