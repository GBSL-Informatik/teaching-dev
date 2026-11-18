import { AnchorType } from '../checks/Check';
import { Check, CHECK_KINDS, isCheckKind } from '../checks/kinds';
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

type PlainObject = { [key: string]: unknown };

/**
 * Validates a spec loaded from YAML, which is only plain data at runtime. The structure is checked,
 * so hand edits cannot crash the grader; the expected values are compared as they are.
 */
export const parseSpec = (value: unknown): ParsedSpec => {
    if (!isObject(value) || value.version !== SPEC_VERSION || !Array.isArray(value.checks)) {
        return { errors: [`Keine gültige docx-spec (Version ${SPEC_VERSION} mit einer Liste «checks»).`] };
    }
    const errors: string[] = [];
    const usedIds = new Set<string>();
    const checks = value.checks.filter((check, index) => {
        const error = checkError(check, index, usedIds);
        if (error) {
            errors.push(error);
            return false;
        }
        usedIds.add((check as Check).id);
        return true;
    }) as Check[];

    const equivalentCharacters = value.equivalentCharacters;
    const hasValidEquivalents =
        equivalentCharacters === undefined || isEquivalentCharacters(equivalentCharacters);
    if (!hasValidEquivalents) {
        errors.push(
            '«equivalentCharacters» muss eine Liste von Listen von Zeichen sein; sie wird ignoriert.'
        );
    }

    const spec: DocxSpec = {
        version: SPEC_VERSION,
        source: String(value.source ?? ''),
        ...(hasValidEquivalents && equivalentCharacters ? { equivalentCharacters } : {}),
        checks
    };
    return { spec, errors };
};

const checkError = (check: unknown, index: number, usedIds: Set<string>): string | undefined => {
    if (!isObject(check) || typeof check.id !== 'string') {
        return `Check Nr. ${index + 1} hat keine «id».`;
    }
    const name = `Check «${check.id}»`;
    if (usedIds.has(check.id)) {
        return `${name} kommt mehrfach vor.`;
    }
    if (!isCheckKind(check.kind)) {
        return `${name} hat die unbekannte Art «${String(check.kind)}».`;
    }
    if (typeof check.title !== 'string' || !isObject(check.expect)) {
        return `${name} braucht einen «title» und ein «expect».`;
    }
    const anchorType = CHECK_KINDS[check.kind].anchors;
    if (anchorType !== 'none' && !hasAnchors(check, anchorType)) {
        return `${name} braucht eine Liste «anchors».`;
    }
    return undefined;
};

const hasAnchors = (check: PlainObject, anchorType: Exclude<AnchorType, 'none'>) => {
    if (!Array.isArray(check.anchors)) {
        return false;
    }
    return check.anchors.every((anchor) => {
        if (anchorType === 'image') {
            return isObject(anchor) && typeof anchor.image === 'number';
        }
        return isObject(anchor) && typeof anchor.text === 'string';
    });
};

const isEquivalentCharacters = (value: unknown): value is EquivalentCharacters => {
    return (
        Array.isArray(value) &&
        value.every((group) => Array.isArray(group) && group.every((char) => typeof char === 'string'))
    );
};

const isObject = (value: unknown): value is PlainObject => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
