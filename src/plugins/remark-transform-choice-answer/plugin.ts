import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, BlockContent, DefinitionContent } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';

enum ChoiceComponentTypes {
    ChoiceAnswer = 'ChoiceAnswer',
    TrueFalseAnswer = 'TrueFalseAnswer'
}

type FlowChildren = (BlockContent | DefinitionContent)[];

function createWrapper(name: string, children: FlowChildren): MdxJsxFlowElement {
    return {
        type: 'mdxJsxFlowElement',
        name,
        attributes: [],
        children
    };
}

const plugin: Plugin<[], Root> = function choiceAnswerWrapPlugin() {
    return (tree) => {
        visit(tree, 'mdxJsxFlowElement', (node) => {
            if (
                !node.name ||
                !Object.values(ChoiceComponentTypes).includes(node.name as ChoiceComponentTypes)
            ) {
                return;
            }

            const listIndex = node.children.findIndex((child) => child.type === 'list');

            if (listIndex === -1) {
                if (node.name !== ChoiceComponentTypes.TrueFalseAnswer) {
                    console.warn(`No list found in <${node.name}>. Expected exactly one list child.`);
                }
                return;
            }

            if (node.children.filter((child) => child.type === 'list').length > 1) {
                console.warn(`Multiple lists found in <${node.name}>. Only the first one is used.`);
            }

            const beforeChildren = node.children.slice(0, listIndex) as FlowChildren;

            const listChild = node.children[listIndex] as BlockContent | DefinitionContent;

            const afterChildren = node.children.slice(listIndex + 1) as FlowChildren;

            const wrappedChildren: FlowChildren = [];

            if (beforeChildren.length > 0) {
                wrappedChildren.push(createWrapper(`${node.name}.Before`, beforeChildren));
            }

            wrappedChildren.push(createWrapper(`${node.name}.Options`, [listChild]));

            if (afterChildren.length > 0) {
                wrappedChildren.push(createWrapper(`${node.name}.After`, afterChildren));
            }

            node.children = wrappedChildren;
        });
    };
};

export default plugin;
