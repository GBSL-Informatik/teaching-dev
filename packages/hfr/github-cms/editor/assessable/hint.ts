import type { AlertType } from '@tdev-components/shared/Alert';
import { expressionAttribute, findAttribute, stringAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';
import type { HintProps } from './components';

const WHEN = 'when' satisfies keyof HintProps;
const COLOR = 'color' satisfies keyof HintProps;

/** the conditions of core as written in MDX, e.g. `correct` or `assessed`: `Correctness` is an enum */
type When = `${Extract<HintProps['when'], string>}`;

interface HintCondition {
    value: string;
    label: string;
    /** the color of the hint on the page, see `ColorMapping` of `Feedback/Hint` */
    color: AlertType;
}

/** one for each condition: the typecheck fails when core adds, renames or removes a condition */
const CONDITIONS: Record<When, Omit<HintCondition, 'value'>> = {
    correct: { label: 'richtig', color: 'success' },
    incorrect: { label: 'falsch', color: 'danger' },
    partially_correct: { label: 'teilweise richtig', color: 'warning' },
    not_answered: { label: 'nicht beantwortet', color: 'secondary' },
    assessed: { label: 'bewertet', color: 'info' },
    unassessed: { label: 'nicht bewertet', color: 'info' }
};

export const HINT_CONDITIONS: HintCondition[] = Object.entries(CONDITIONS).map(([value, condition]) => ({
    value,
    ...condition
}));

const CONDITION_LIST_PATTERN = /^\s*\[\s*(['"]\w+['"]\s*,\s*)*(['"]\w+['"])?\s*,?\s*\]\s*$/;

/**
 * The conditions of `<Hint when="correct">` or `<Hint when={['correct', 'incorrect']}>`,
 * `null` when they are not written as a string or a list of known conditions, e.g. a function.
 */
export const hintConditions = (attributes: JsxAttribute[]): string[] | null => {
    const conditions = writtenConditions(attributes);
    const isKnown = (condition: string) => HINT_CONDITIONS.some(({ value }) => value === condition);
    return conditions?.every(isKnown) ? conditions : null;
};

const writtenConditions = (attributes: JsxAttribute[]): string[] | null => {
    const attribute = findAttribute(attributes, WHEN);
    if (!attribute) {
        return [];
    }
    if (attribute.type === 'attribute') {
        return attribute.value ? [attribute.value] : null;
    }
    if (!CONDITION_LIST_PATTERN.test(attribute.value)) {
        return null;
    }
    return [...attribute.value.matchAll(/['"](\w+)['"]/g)].map(([, condition]) => condition);
};

/** a single condition is written as string, several as a list, in the order of `HINT_CONDITIONS` */
export const withHintConditions = (attributes: JsxAttribute[], conditions: string[]): JsxAttribute[] => {
    const ordered = HINT_CONDITIONS.map(({ value }) => value).filter((value) => conditions.includes(value));
    if (ordered.length <= 1) {
        const value = ordered[0];
        return withAttribute(attributes, WHEN, value ? { type: 'attribute', name: WHEN, value } : null);
    }
    const list = `[${ordered.map((condition) => `'${condition}'`).join(', ')}]`;
    return withAttribute(attributes, WHEN, expressionAttribute(WHEN, list));
};

/** all values of `AlertType`, the type checks that none is unknown */
const ALERT_COLORS: AlertType[] = ['primary', 'secondary', 'blue', 'success', 'info', 'warning', 'danger'];

/** the `color` attribute, else the color of the first condition */
export const hintColor = (attributes: JsxAttribute[]): AlertType => {
    const color = stringAttribute(attributes, COLOR);
    const alertColor = ALERT_COLORS.find((candidate) => candidate === color);
    if (alertColor) {
        return alertColor;
    }
    const [first] = hintConditions(attributes) ?? [];
    return HINT_CONDITIONS.find(({ value }) => value === first)?.color ?? 'info';
};
