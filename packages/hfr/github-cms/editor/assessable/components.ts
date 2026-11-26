import type Hint from '@tdev-components/documents/Assessable/Feedback/Hint';
import type { Node, ResolvedPos } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { ComponentProps } from 'react';
import { paragraph } from '../commands';
import type { ImportSpec } from '../imports';
import { expressionAttribute, findAttribute, flagAttribute } from '../jsxAttributes';
import { isJsxFlow, schema } from '../schema';
import { idAttribute } from '../uuid';
import { withHintConditions } from './hint';

const { nodes } = schema;

/**
 * The assessable components of `@tdev-components/documents/Assessable`, see
 * https://teaching-dev.gbsl.website/docs/gallery/persistable-documents/answer/choice-answer
 */
const QUIZ = 'Quiz';
const CHOICE_ANSWER = 'ChoiceAnswer';
const TRUE_FALSE_ANSWER = 'TrueFalseAnswer';
const HINT = 'Hint';

export const isQuiz = (node: Node) => isJsxFlow(node, QUIZ);
export const isChoiceAnswer = (node: Node) => isJsxFlow(node, CHOICE_ANSWER);
export const isTrueFalseAnswer = (node: Node) => isJsxFlow(node, TRUE_FALSE_ANSWER);
export const isHint = (node: Node) => isJsxFlow(node, HINT);
export const isQuestion = (node: Node) => isChoiceAnswer(node) || isTrueFalseAnswer(node);

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

/**
 * The positions of the questions outside of a quiz without `id`, e.g. moved out of a quiz.
 * They are not rendered on the page: the id of their document is missing.
 */
export const standaloneQuestionsWithoutId = (doc: Node): number[] => {
    const positions: number[] = [];
    doc.descendants((node, pos) => {
        if (isQuiz(node)) {
            return false;
        }
        if (isQuestion(node) && !findAttribute(node.attrs.attributes, 'id')) {
            positions.push(pos);
        }
        return true;
    });
    return positions;
};

// The controls are typed against the props of core: renaming or removing a prop, a value or
// a component fails the typecheck. Keep the import paths below in sync with the sources of the imports.
export type { ChoiceAnswerProps } from '@tdev-components/documents/Assessable/ChoiceAnswer';
export type { Props as QuizProps } from '@tdev-components/documents/Assessable/Quiz';
export type { Props as TrueFalseAnswerProps } from '@tdev-components/documents/Assessable/TrueFalseAnswer';
export type HintProps = ComponentProps<typeof Hint>;

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

const options = (labels: string[]) => {
    const items = labels.map((label) => nodes.list_item.create(null, paragraph(label)));
    return nodes.ordered_list.create(null, items);
};

/** the questions of a quiz have no `id`: they are stored in the document of the quiz */
export const createChoiceAnswer = (isInQuiz: boolean, multiple: boolean) => {
    const attributes = [
        expressionAttribute('correct', '[1]'),
        ...(multiple ? [flagAttribute('multiple')] : [])
    ];
    return nodes.jsx_flow.create(
        { name: CHOICE_ANSWER, attributes: isInQuiz ? attributes : [...attributes, idAttribute()] },
        [paragraph('Frage'), options(['Antwort 1', 'Antwort 2', 'Antwort 3'])]
    );
};

export const createTrueFalseAnswer = (isInQuiz: boolean) => {
    const attributes = [expressionAttribute('correct', 'true')];
    return nodes.jsx_flow.create(
        { name: TRUE_FALSE_ANSWER, attributes: isInQuiz ? attributes : [...attributes, idAttribute()] },
        paragraph('Aussage')
    );
};

export const createQuiz = () =>
    nodes.jsx_flow.create({ name: QUIZ, attributes: [idAttribute()] }, createChoiceAnswer(true, false));

export const createHint = () =>
    nodes.jsx_flow.create(
        { name: HINT, attributes: withHintConditions([], ['incorrect']) },
        paragraph('Hinweis')
    );
