import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, BlockContent, DefinitionContent } from 'mdast';
import type { MdxJsxAttributeValueExpression, MdxJsxFlowElement } from 'mdast-util-mdx';

enum ChoiceComponentTypes {
    ChoiceAnswer = 'ChoiceAnswer',
    TrueFalseAnswer = 'TrueFalseAnswer'
}

const QUIZ_NODE_NAME = 'Quiz';

type FlowChildren = (BlockContent | DefinitionContent)[];

function createWrapper(name: string, children: FlowChildren, attributes: any[] = []): MdxJsxFlowElement {
    return {
        type: 'mdxJsxFlowElement',
        name,
        attributes: attributes.map((attr) => ({
            type: 'mdxJsxAttribute',
            name: attr.name,
            value: attr.value
        })),
        children
    };
}

const createWrappedOption = (listChildren: { type: string; children: FlowChildren }[]): MdxJsxFlowElement => {
    const options = listChildren
        .filter((child) => child.type === 'listItem')
        .map((child, index) => {
            return createWrapper('ChoiceAnswer.Option', child.children, [
                { name: 'optionIndex', value: index }
            ]);
        });

    return createWrapper('ChoiceAnswer.Options', options);
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
        wrappedChildren.push(createWrapper(`${questionNode.name}.Before`, beforeChildren));
    }

    wrappedChildren.push(
        createWrappedOption(listChild.children as { type: string; children: FlowChildren }[])
    );

    if (afterChildren.length > 0) {
        wrappedChildren.push(createWrapper(`${questionNode.name}.After`, afterChildren));
    }

    questionNode.children = wrappedChildren;
};

const transformQuestions = (questionNodes: MdxJsxFlowElement[]) => {
    questionNodes.forEach((questionNode, index: number) => {
        transformQuestion(questionNode);
        questionNode.attributes.push({
            type: 'mdxJsxAttribute',
            name: 'questionIndex',
            value: index.toString()
        });
    });
};

const transformQuiz = (quizNode: MdxJsxFlowElement) => {
    const questions = [] as MdxJsxFlowElement[];
    visit(quizNode, 'mdxJsxFlowElement', (childNode) => {
        if (Object.values(ChoiceComponentTypes).includes(childNode.name as ChoiceComponentTypes)) {
            questions.push(childNode);
        }
    });

    transformQuestions(questions);
};

const plugin: Plugin<[], Root> = function choiceAnswerWrapPlugin() {
    return (tree) => {
        visit(tree, 'mdxJsxFlowElement', (node) => {
            if (node.name == QUIZ_NODE_NAME) {
                // Enumerate and transform questions inside the quiz.
                transformQuiz(node);
            } else if (
                Object.values(ChoiceComponentTypes).includes(node.name as ChoiceComponentTypes) &&
                !((node as any).parent?.name === QUIZ_NODE_NAME)
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
