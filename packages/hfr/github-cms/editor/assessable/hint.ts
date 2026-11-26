import { findAttribute, stringAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';

export interface HintCondition {
    value: string;
    label: string;
    /** the color of the hint on the page, see `Feedback/Hint` */
    color: string;
}

export const HINT_CONDITIONS: HintCondition[] = [
    { value: 'correct', label: 'richtig', color: 'success' },
    { value: 'incorrect', label: 'falsch', color: 'danger' },
    { value: 'partially_correct', label: 'teilweise richtig', color: 'warning' },
    { value: 'not_answered', label: 'nicht beantwortet', color: 'secondary' },
    { value: 'assessed', label: 'bewertet', color: 'info' },
    { value: 'unassessed', label: 'nicht bewertet', color: 'info' }
];

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
    const attribute = findAttribute(attributes, 'when');
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
        return withAttribute(attributes, 'when', value ? { type: 'attribute', name: 'when', value } : null);
    }
    const list = `[${ordered.map((condition) => `'${condition}'`).join(', ')}]`;
    return withAttribute(attributes, 'when', { type: 'expressionAttribute', name: 'when', value: list });
};

/** see `AlertType` of `@tdev-components/shared/Alert` */
const ALERT_COLORS = ['primary', 'secondary', 'blue', 'success', 'info', 'warning', 'danger'];

/** the `color` attribute, else the color of the first condition */
export const hintColor = (attributes: JsxAttribute[]): string => {
    const color = stringAttribute(attributes, 'color');
    if (color && ALERT_COLORS.includes(color)) {
        return color;
    }
    const [first] = hintConditions(attributes) ?? [];
    return HINT_CONDITIONS.find(({ value }) => value === first)?.color ?? 'info';
};
