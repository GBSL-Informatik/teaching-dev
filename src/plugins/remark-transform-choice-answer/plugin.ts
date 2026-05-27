import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { Root, BlockContent, DefinitionContent } from 'mdast';
import type { MdxJsxAttribute, MdxJsxExpressionAttribute, MdxJsxFlowElement } from 'mdast-util-mdx';
import { toJsxAttribute, toMdxJsxExpressionAttribute } from '../helpers';
import path from 'path';
import { promises as fs } from 'fs';

enum ChoiceComponentTypes {
    ChoiceAnswer = 'ChoiceAnswer',
    TrueFalseAnswer = 'TrueFalseAnswer'
}

const QUIZ_NODE_NAME = 'Quiz';
// const BEFORE_WRAPPER_NAME = 'ChoiceAnswer.Before';
const OPTIONS_WRAPPER_NAME = 'ChoiceAnswer.Options';
const OPTION_WRAPPER_NAME = 'ChoiceAnswer.Option';
// const AFTER_WRAPPER_NAME = 'ChoiceAnswer.After';

type FlowChildren = (BlockContent | DefinitionContent)[];

function createWrapper(
    name: string,
    children: FlowChildren,
    attributes: MdxJsxAttribute[] = []
): MdxJsxFlowElement {
    return {
        type: 'mdxJsxFlowElement',
        name,
        attributes,
        children
    };
}

const createWrappedOption = (
    listChildren: { type: string; children: FlowChildren }[]
): { wrappedOptions: MdxJsxFlowElement; optionsCount: number } => {
    const options = listChildren
        .filter((child) => child.type === 'listItem')
        .map((child, index) => {
            return createWrapper(OPTION_WRAPPER_NAME, child.children, [
                toMdxJsxExpressionAttribute('optionIndex', index, {
                    type: 'Literal',
                    value: index,
                    raw: `${index}`
                })
            ]);
        });

    return { wrappedOptions: createWrapper(OPTIONS_WRAPPER_NAME, options), optionsCount: options.length };
};

const transformQuestion = (questionNode: MdxJsxFlowElement) => {
    const listIndex = questionNode.children.findIndex((child) => child.type === 'list');

    if (listIndex === -1) {
        if (questionNode.name !== ChoiceComponentTypes.TrueFalseAnswer) {
            console.warn(`No list found in <${questionNode.name}>. Expected exactly one list child.`);
        }
        return;
    }

    if (questionNode.children.filter((child) => child.type === 'list').length > 1) {
        console.warn(`Multiple lists found in <${questionNode.name}>. Only the first one is used.`);
    }

    const beforeChildren = questionNode.children.slice(0, listIndex) as FlowChildren;
    const listChild = questionNode.children[listIndex] as { children: FlowChildren };

    const afterChildren = questionNode.children.slice(listIndex + 1) as FlowChildren;

    const wrappedChildren: FlowChildren = [];

    if (beforeChildren.length > 0) {
        wrappedChildren.push(...beforeChildren);
    }

    const { wrappedOptions, optionsCount } = createWrappedOption(
        listChild.children as { type: string; children: FlowChildren }[]
    );
    wrappedChildren.push(wrappedOptions);
    questionNode.attributes.push(toJsxAttribute('optionsCount', optionsCount));

    if (afterChildren.length > 0) {
        wrappedChildren.push(...afterChildren);
    }

    questionNode.children = wrappedChildren;
};

const isLiteralExpression = (
    attr?: MdxJsxAttribute
): attr is MdxJsxAttribute & {
    value: { type: 'mdxJsxAttributeValueExpression'; value: string; data: { estree: any } };
} => {
    if (!attr) {
        return false;
    }
    return (
        attr.value !== null &&
        typeof attr.value === 'object' &&
        attr.value.type === 'mdxJsxAttributeValueExpression' &&
        attr.value.data?.estree?.body.length === 1 &&
        attr.value.data.estree.body[0].type === 'ExpressionStatement' &&
        attr.value.data.estree.body[0].expression.type === 'Literal'
    );
};

const qidGenerator = () => {
    const qidMap = new Map<string, MdxJsxAttribute>();
    let counter = 1;
    const generator = (qid?: MdxJsxAttribute | MdxJsxExpressionAttribute) => {
        if (qid && qid.type === 'mdxJsxExpressionAttribute') {
            throw new Error('Expression attributes are not supported for qid generation');
        }
        const literalExpression = isLiteralExpression(qid) ? qid : null;
        if (qid && qid.value && typeof qid.value !== 'string' && !literalExpression) {
            qidMap.set(qid.value.value, qid);
            return qid;
        }

        let id = qid
            ? literalExpression
                ? `${literalExpression.value.data.estree.body[0].expression.value}`
                : (qid.value as string)
            : `q${counter++}`;

        let localCounter = 1;
        while (qidMap.has(id)) {
            if (qid) {
                id = `${id}.${localCounter++}`;
            } else {
                id = `q${counter++}`;
            }
        }
        const jsxAttr = toJsxAttribute('qid', id);
        qidMap.set(id, jsxAttr);
        return jsxAttr;
    };
    return { generator, qidSet: qidMap };
};

const transformQuiz = (quizNode: MdxJsxFlowElement) => {
    const { generator: getQid, qidSet } = qidGenerator();

    visit(quizNode, 'mdxJsxFlowElement', (childNode) => {
        // TODO: use a set for the check
        if (Object.values(ChoiceComponentTypes).includes(childNode.name as ChoiceComponentTypes)) {
            transformQuestion(childNode);
            const qidIdx = childNode.attributes.findIndex((attr) => (attr as any).name === 'qid');
            const qidAttr = getQid(childNode.attributes[qidIdx]);
            if (qidIdx === -1) {
                childNode.attributes.push(qidAttr);
            } else if (qidAttr !== childNode.attributes[qidIdx]) {
                childNode.attributes[qidIdx] = qidAttr;
            }
        }
    });
    const qids = toMdxJsxExpressionAttribute('questionIds', [...qidSet.keys()], {
        type: 'ArrayExpression',
        elements: [...qidSet.values()].map((val) => {
            if (typeof val.value === 'string') {
                return {
                    type: 'Literal',
                    value: val.value,
                    raw: `'${val.value}'`
                };
            }
            if (!val.value) {
                throw new Error('Unexpected non-string qid value');
            }
            return (val.value.data?.estree?.body[0] as { expression: any })?.expression;
        })
    });
    quizNode.attributes.push(qids);
};

const plugin: Plugin<[], Root> = function choiceAnswerWrapPlugin(this, options = []): Transformer<Root> {
    return async (tree, vfile) => {
        visit(tree, 'mdxJsxFlowElement', (node) => {
            if (node.name === QUIZ_NODE_NAME) {
                // Enumerate and transform questions inside the quiz.
                transformQuiz(node);
            } else if (
                Object.values(ChoiceComponentTypes).includes(node.name as ChoiceComponentTypes) &&
                !((node as any).parent?.name === QUIZ_NODE_NAME) &&
                !node.attributes.some((attr) => (attr as any).name === 'qid')
            ) {
                // Transform standalone question.
                transformQuestion(node);
            } else {
                return;
            }
        });
    };
};

export default plugin;
