import { findAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';

/** `isTrue`, `correct={false}`... `undefined` when not written, `null` when not a boolean literal */
const booleanAttribute = (attributes: JsxAttribute[], name: string): boolean | undefined | null => {
    const attribute = findAttribute(attributes, name);
    if (!attribute) {
        return undefined;
    }
    if (attribute.type === 'attribute') {
        return attribute.value === null ? true : null;
    }
    const value = attribute.value.trim();
    if (value === 'true' || value === 'false') {
        return value === 'true';
    }
    return null;
};

/** the attributes setting the answer, see `TrueFalseAnswer`'s `ModelMeta` */
const NAMES = ['isTrue', 'correct', 'isFalse', 'incorrect'];

/**
 * Whether the statement of `<TrueFalseAnswer>` is true, like `TrueFalseAnswer`'s model:
 * `isTrue` or `correct` make it true, otherwise it is false.
 * `null` when an attribute is not a boolean literal, e.g. `correct={isTrue}`.
 */
export const isStatementTrue = (attributes: JsxAttribute[]): boolean | null => {
    const values = NAMES.map((name) => booleanAttribute(attributes, name));
    if (values.includes(null)) {
        return null;
    }
    const [isTrue, correct] = values;
    return (isTrue ?? correct) === true;
};

/** writes the answer as `correct={true}` or `correct={false}`, replacing its other forms */
export const withStatementTrue = (attributes: JsxAttribute[], isTrue: boolean): JsxAttribute[] => {
    const correct: JsxAttribute = { type: 'expressionAttribute', name: 'correct', value: `${isTrue}` };
    const otherForms = NAMES.filter((name) => name !== 'correct');
    return otherForms.reduce(
        (result, name) => withAttribute(result, name, null),
        withAttribute(attributes, 'correct', correct)
    );
};
