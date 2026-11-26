import type { ImportSpec } from '../imports';
import { findAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';

/**
 * The scoring functions of `@tdev-components/documents/Assessable/helpers/scoring`,
 * set as `scoring={points(1, -0.5)}` on a question or a quiz.
 */
const SCORING_SOURCE = '@tdev-components/documents/Assessable/helpers/scoring';

type Argument = number | boolean;

export interface Parameter {
    label: string;
    title: string;
    defaultValue: Argument;
    /** the scoring function has a default value, so the argument can be left out */
    optional: boolean;
}

export interface ScoringFunction {
    name: string;
    label: string;
    parameters: Parameter[];
}

export const SCORING_FUNCTIONS: ScoringFunction[] = [
    {
        name: 'points',
        label: 'Punkte',
        parameters: [
            { label: 'richtig', title: 'Punkte wenn richtig', defaultValue: 1, optional: true },
            { label: 'falsch', title: 'Punkte wenn falsch', defaultValue: 0, optional: true },
            { label: 'leer', title: 'Punkte wenn nicht beantwortet', defaultValue: 0, optional: true }
        ]
    },
    {
        name: 'multipleChoicePoints',
        label: 'Multiple-Choice-Punkte',
        parameters: [
            {
                label: 'max.',
                title: 'Punkte wenn alle Antworten richtig sind',
                defaultValue: 1,
                optional: false
            },
            {
                label: 'Abzug',
                title: 'Abzug pro falscher Auswahl / Nicht-Auswahl',
                defaultValue: 1,
                optional: false
            },
            {
                label: 'negativ',
                title: 'Die Gesamtpunktzahl kann negativ sein',
                defaultValue: false,
                optional: true
            }
        ]
    },
    { name: 'noPoints', label: 'Keine Punkte', parameters: [] }
];

export interface Scoring {
    fn: ScoringFunction;
    /** one argument for each parameter */
    args: Argument[];
}

/** the `scoring` attribute: none, a call of a scoring function, or any other expression */
export type ScoringAttribute = { kind: 'none' } | { kind: 'call'; scoring: Scoring } | { kind: 'custom' };

export const scoringAttribute = (attributes: JsxAttribute[]): ScoringAttribute => {
    const attribute = findAttribute(attributes, 'scoring');
    if (!attribute) {
        return { kind: 'none' };
    }
    const scoring = attribute.type === 'expressionAttribute' ? parseScoring(attribute.value) : null;
    return scoring ? { kind: 'call', scoring } : { kind: 'custom' };
};

/** `null` removes the `scoring` attribute */
export const withScoring = (attributes: JsxAttribute[], scoring: Scoring | null): JsxAttribute[] => {
    const updated: JsxAttribute | null = scoring
        ? { type: 'expressionAttribute', name: 'scoring', value: scoringExpression(scoring) }
        : null;
    return withAttribute(attributes, 'scoring', updated);
};

export const defaultScoring = (fn: ScoringFunction): Scoring => ({
    fn,
    args: fn.parameters.map((parameter) => parameter.defaultValue)
});

export const scoringImport = (scoring: Scoring): ImportSpec => ({
    name: scoring.fn.name,
    source: SCORING_SOURCE,
    named: true
});

const CALL_PATTERN = /^\s*(\w+)\s*\(([^()]*)\)\s*$/;

/** e.g. `points(1, -0.5)`, `null` for other expressions */
export const parseScoring = (expression: string): Scoring | null => {
    const match = CALL_PATTERN.exec(expression);
    const fn = SCORING_FUNCTIONS.find((candidate) => candidate.name === match?.[1]);
    if (!match || !fn) {
        return null;
    }
    const written = match[2].trim() ? match[2].split(',').map(parseArgument) : [];
    const hasOnlyLiterals = written.every((arg) => arg !== undefined);
    if (!hasOnlyLiterals || written.length > fn.parameters.length) {
        return null;
    }
    const args = fn.parameters.map((parameter, index) => written[index] ?? parameter.defaultValue);
    const hasMatchingTypes = args.every(
        (arg, index) => typeof arg === typeof fn.parameters[index].defaultValue
    );
    return hasMatchingTypes ? { fn, args } : null;
};

/** trailing arguments equal to their default are left out, e.g. `points(2)` */
export const scoringExpression = ({ fn, args }: Scoring): string => {
    const isOmittable = (index: number) =>
        fn.parameters[index].optional && args[index] === fn.parameters[index].defaultValue;
    let count = args.length;
    while (count > 0 && isOmittable(count - 1)) {
        count--;
    }
    return `${fn.name}(${args.slice(0, count).join(', ')})`;
};

const NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)$/;

/** `undefined` for an argument that is neither a number nor a boolean literal */
const parseArgument = (source: string): Argument | undefined => {
    const text = source.trim();
    if (text === 'true' || text === 'false') {
        return text === 'true';
    }
    return NUMBER_PATTERN.test(text) ? Number(text) : undefined;
};
