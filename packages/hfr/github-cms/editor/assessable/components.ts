import type { Node, ResolvedPos } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { ImportSpec } from '../imports';
import { type JsxAttribute, schema } from '../schema';
import { newUuid } from '../uuid';

const { nodes } = schema;

/**
 * The assessable components of `@tdev-components/documents/Assessable`, see
 * https://teaching-dev.gbsl.website/docs/gallery/persistable-documents/answer/choice-answer
 */
const QUIZ = 'Quiz';
const CHOICE_ANSWER = 'ChoiceAnswer';
const TRUE_FALSE_ANSWER = 'TrueFalseAnswer';
const HINT = 'Hint';

const isJsx = (node: Node, name: string) => node.type === nodes.jsx_flow && node.attrs.name === name;
export const isQuiz = (node: Node) => isJsx(node, QUIZ);
export const isChoiceAnswer = (node: Node) => isJsx(node, CHOICE_ANSWER);
export const isTrueFalseAnswer = (node: Node) => isJsx(node, TRUE_FALSE_ANSWER);
export const isHint = (node: Node) => isJsx(node, HINT);
const isQuestion = (node: Node) => isChoiceAnswer(node) || isTrueFalseAnswer(node);
/** the components with a `scoring` attribute, the questions inherit the scoring of their quiz */
export const isScored = (node: Node) => isQuiz(node) || isQuestion(node);

const hasAncestor = ($pos: ResolvedPos, predicate: (node: Node) => boolean) => {
    for (let depth = $pos.depth; depth > 0; depth--) {
        if (predicate($pos.node(depth))) {
            return true;
        }
    }
    return false;
};
export const isInQuiz = (state: EditorState) => hasAncestor(state.selection.$from, isQuiz);
/** hints are shown by the question they are placed in */
export const isInQuestion = (state: EditorState) => hasAncestor(state.selection.$from, isQuestion);

const ASSESSABLE_SOURCE = '@tdev-components/documents/Assessable';
export const QUIZ_IMPORT: ImportSpec = { name: QUIZ, source: `${ASSESSABLE_SOURCE}/Quiz` };
export const CHOICE_ANSWER_IMPORT: ImportSpec = {
    name: CHOICE_ANSWER,
    source: `${ASSESSABLE_SOURCE}/ChoiceAnswer`
};
export const TRUE_FALSE_ANSWER_IMPORT: ImportSpec = {
    name: TRUE_FALSE_ANSWER,
    source: `${ASSESSABLE_SOURCE}/TrueFalseAnswer`
};
export const HINT_IMPORT: ImportSpec = { name: HINT, source: `${ASSESSABLE_SOURCE}/Feedback/Hint` };

const paragraph = (text: string) => nodes.paragraph.create(null, schema.text(text));
const idAttribute = (): JsxAttribute => ({ type: 'attribute', name: 'id', value: newUuid() });
const flag = (name: string): JsxAttribute => ({ type: 'attribute', name, value: null });
const expression = (name: string, value: string): JsxAttribute => ({
    type: 'expressionAttribute',
    name,
    value
});

const options = (labels: string[]) => {
    const items = labels.map((label) => nodes.list_item.create(null, paragraph(label)));
    return nodes.ordered_list.create(null, items);
};

/** the questions of a quiz have no `id`: they are stored in the document of the quiz */
export const createChoiceAnswer = (isInQuiz: boolean, multiple: boolean) => {
    const attributes = [expression('correct', '[1]'), ...(multiple ? [flag('multiple')] : [])];
    return nodes.jsx_flow.create(
        { name: CHOICE_ANSWER, attributes: isInQuiz ? attributes : [...attributes, idAttribute()] },
        [paragraph('Frage'), options(['Antwort 1', 'Antwort 2', 'Antwort 3'])]
    );
};

export const createTrueFalseAnswer = (isInQuiz: boolean) => {
    const attributes = [expression('correct', 'true')];
    return nodes.jsx_flow.create(
        { name: TRUE_FALSE_ANSWER, attributes: isInQuiz ? attributes : [...attributes, idAttribute()] },
        paragraph('Aussage')
    );
};

export const createQuiz = () =>
    nodes.jsx_flow.create({ name: QUIZ, attributes: [idAttribute()] }, createChoiceAnswer(true, false));

export const createHint = () =>
    nodes.jsx_flow.create(
        { name: HINT, attributes: [{ type: 'attribute', name: 'when', value: 'incorrect' }] },
        paragraph('Hinweis')
    );
