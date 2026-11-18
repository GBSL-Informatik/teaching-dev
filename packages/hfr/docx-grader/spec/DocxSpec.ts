import { Check, isCheckKind } from '../checks/kinds';
import { EquivalentCharacters } from '../checks/normalizeText';

export const SPEC_VERSION = 1;

/** Written by the CLI as `<name>.docx-spec.yaml`; teachers add `hint` and `docs` to checks by hand. */
export interface DocxSpec {
    version: typeof SPEC_VERSION;
    /** File name of the original document. */
    source: string;
    /** Characters treated as equal when comparing text; defaults to dashes, quotes and apostrophes. */
    equivalentCharacters?: EquivalentCharacters;
    checks: Check[];
}

export interface ParsedSpec {
    spec?: DocxSpec;
    /** Problems in the spec file; checks with problems are left out of `spec`. */
    errors: string[];
}

/** Validates a spec loaded from YAML, which is only plain data at runtime. */
export const parseSpec = (value: unknown): ParsedSpec => {
    if (!isObject(value) || value.version !== SPEC_VERSION || !Array.isArray(value.checks)) {
        return { errors: [`Keine gültige docx-spec (Version ${SPEC_VERSION} mit einer Liste «checks»).`] };
    }
    const errors: string[] = [];
    const checks = value.checks.filter((check, index) => {
        if (!isObject(check) || typeof check.id !== 'string') {
            errors.push(`Check Nr. ${index + 1} hat keine «id».`);
            return false;
        }
        if (!isCheckKind(check.kind)) {
            errors.push(`Check «${check.id}» hat die unbekannte Art «${String(check.kind)}».`);
            return false;
        }
        return true;
    }) as Check[]; // The expectations of each kind are trusted: the CLI wrote them.

    const spec: DocxSpec = {
        version: SPEC_VERSION,
        source: String(value.source ?? ''),
        equivalentCharacters: value.equivalentCharacters as EquivalentCharacters | undefined,
        checks
    };
    return { spec, errors };
};

const isObject = (value: unknown): value is { [key: string]: unknown } => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
