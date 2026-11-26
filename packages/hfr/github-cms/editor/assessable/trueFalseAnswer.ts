import { booleanAttribute, expressionAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';
import type { TrueFalseAnswerProps } from './components';

const CORRECT = 'correct' satisfies keyof TrueFalseAnswerProps;

/** the attributes setting the answer, see `TrueFalseAnswer`'s `ModelMeta` */
const NAMES = ['isTrue', CORRECT, 'isFalse', 'incorrect'] satisfies (keyof TrueFalseAnswerProps)[];

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
    const correct = expressionAttribute(CORRECT, `${isTrue}`);
    const otherForms = NAMES.filter((name) => name !== CORRECT);
    return otherForms.reduce(
        (result, name) => withAttribute(result, name, null),
        withAttribute(attributes, CORRECT, correct)
    );
};
