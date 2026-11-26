import type { Node } from 'prosemirror-model';
import { expressionAttribute, findAttribute, withAttribute } from '../jsxAttributes';
import { type JsxAttribute, schema } from '../schema';
import type { ChoiceAnswerProps } from './components';

const { nodes } = schema;

export const CORRECT = 'correct' satisfies keyof ChoiceAnswerProps;
export const MULTIPLE = 'multiple' satisfies keyof ChoiceAnswerProps;

const CORRECT_PATTERN = /^\s*\[\s*(\d+(\s*,\s*\d+)*)?\s*,?\s*\]\s*$/;

/**
 * The correct options of `<ChoiceAnswer correct={[1, 3]}>`, the first option is `1`.
 * `null` when they are not written as a list of numbers, e.g. `correct={solution}`.
 */
export const correctOptions = (attributes: JsxAttribute[]): number[] | null => {
    const attribute = findAttribute(attributes, CORRECT);
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
    return withAttribute(attributes, CORRECT, expressionAttribute(CORRECT, value));
};

const isList = (node: Node) => node.type === nodes.ordered_list || node.type === nodes.bullet_list;

/**
 * The options are the items of the first list in the question,
 * see `src/plugins/remark-transform-assessable-components`.
 */
export const optionList = (choiceAnswer: Node): { list: Node; offset: number } | null => {
    let found: { list: Node; offset: number } | null = null;
    choiceAnswer.forEach((child, offset) => {
        if (!found && isList(child)) {
            found = { list: child, offset };
        }
    });
    return found;
};

/**
 * The offset of a list in a quote of a question without options, e.g. typed right after
 * the question `> Frage`. Not shown as options on the page, see `optionList`.
 */
export const quotedOptionsOffset = (choiceAnswer: Node): number | null => {
    if (optionList(choiceAnswer)) {
        return null;
    }
    let found: number | null = null;
    choiceAnswer.forEach((child, offset) => {
        if (found !== null || child.type !== nodes.blockquote) {
            return;
        }
        child.forEach((grandchild, innerOffset) => {
            if (found === null && isList(grandchild)) {
                found = offset + 1 + innerOffset;
            }
        });
    });
    return found;
};
