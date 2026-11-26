import type { Node } from 'prosemirror-model';
import { findAttribute, withAttribute } from '../jsxAttributes';
import { type JsxAttribute, schema } from '../schema';

const { nodes } = schema;

const CORRECT_PATTERN = /^\s*\[\s*(\d+(\s*,\s*\d+)*)?\s*,?\s*\]\s*$/;

/**
 * The correct options of `<ChoiceAnswer correct={[1, 3]}>`, the first option is `1`.
 * `null` when they are not written as a list of numbers, e.g. `correct={solution}`.
 */
export const correctOptions = (attributes: JsxAttribute[]): number[] | null => {
    const attribute = findAttribute(attributes, 'correct');
    if (!attribute) {
        return [];
    }
    if (attribute.type !== 'expressionAttribute' || !CORRECT_PATTERN.test(attribute.value)) {
        return null;
    }
    return [...attribute.value.matchAll(/\d+/g)].map(([number]) => Number(number));
};

/** marks the option (`1` is the first) as correct or not, the options are written in ascending order */
export const withCorrectOption = (
    correct: number[],
    attributes: JsxAttribute[],
    option: number,
    isCorrect: boolean
): JsxAttribute[] => {
    const others = correct.filter((number) => number !== option);
    const updated = (isCorrect ? [...others, option] : others).sort((a, b) => a - b);
    const value = `[${updated.join(', ')}]`;
    return withAttribute(attributes, 'correct', { type: 'expressionAttribute', name: 'correct', value });
};

/**
 * The options are the items of the first list in the question,
 * see `src/plugins/remark-transform-assessable-components`.
 */
export const optionList = (choiceAnswer: Node): { list: Node; offset: number } | null => {
    let found: { list: Node; offset: number } | null = null;
    choiceAnswer.forEach((child, offset) => {
        const isList = child.type === nodes.ordered_list || child.type === nodes.bullet_list;
        if (!found && isList) {
            found = { list: child, offset };
        }
    });
    return found;
};
