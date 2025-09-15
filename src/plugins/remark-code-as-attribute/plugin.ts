import type { Plugin, Transformer } from 'unified';
import type { Code, InlineCode, Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { toJsxAttribute, toMdxJsxExpressionAttribute } from '../helpers';

export interface CodeAttributes {
    meta?: string;
    lang?: string;
}

interface ComponentConfig {
    name: string;
    attributeName: string;
    codeAttributesName?: string;
    processMultiple?: boolean;
}

export interface PluginOptions {
    components: ComponentConfig[];
}

export interface MultiCode extends CodeAttributes {
    code: string;
}

const extractCodeAttributes = (node: Code): CodeAttributes => {
    const attrs: CodeAttributes = {};
    if (node.meta) {
        attrs.meta = node.meta;
    }
    if (node.lang) {
        attrs.lang = node.lang;
    }
    return attrs;
};

/**
 * This plugin transforms inline code and code blocks in MDX files to use
 * custom MDX components by converting the code content into attributes.
 */
const plugin: Plugin<PluginOptions[], Root> = function plugin(
    options = { components: [] }
): Transformer<Root> {
    const { components } = options;
    const names = new Set(components.map((c) => c.name));
    return async (root, file) => {
        if (components.length < 1) {
            return;
        }
        const { visit, SKIP, CONTINUE } = await import('unist-util-visit');
        const currentAttributes: MultiCode[] = [];
        const transform = (
            node: InlineCode | Code,
            parent: MdxJsxFlowElement | MdxJsxTextElement,
            index: number
        ): undefined | boolean | typeof SKIP | [typeof SKIP, number] => {
            const component = components.find((c) => c.name === parent.name)!;

            const code = node.value;

            if (component.processMultiple && node.type === 'code') {
                const attrIdx = parent.attributes.findIndex(
                    (attr) => attr.type === 'mdxJsxAttribute' && attr.name === component.attributeName
                );
                const multiCode: MultiCode = {
                    code: code,
                    ...extractCodeAttributes(node)
                };
                currentAttributes.push(multiCode);
                if (attrIdx >= 0) {
                    parent.attributes.splice(
                        attrIdx,
                        1,
                        toJsxAttribute(component.attributeName, currentAttributes)
                    );
                } else {
                    parent.attributes.splice(0, 0, toJsxAttribute(component.attributeName, [multiCode]));
                }
            } else {
                parent.attributes.splice(0, 0, {
                    type: 'mdxJsxAttribute',
                    name: component.attributeName,
                    value: code
                });
                if (node.type === 'code' && component.codeAttributesName) {
                    const attrs = extractCodeAttributes(node);
                    if (Object.keys(attrs).length > 0) {
                        parent.attributes.splice(0, 0, toJsxAttribute(component.codeAttributesName, attrs));
                    }
                }
            }
            if (component.processMultiple) {
                parent.children.splice(index, 1);
                return [SKIP, index];
            } else {
                parent.children.splice(0, parent.children.length);
                return SKIP;
            }
        };
        visit(root, 'inlineCode', (node, index, parent) => {
            if (index === undefined) {
                return;
            }
            if (parent?.type !== 'mdxJsxTextElement' || !names.has(parent.name as string)) {
                return CONTINUE;
            }
            // escape newlines
            node.value = node.value.replace(/\n/g, '\\n');

            return transform(node, parent, index);
        });
        let currentParent: MdxJsxFlowElement | null = null;
        visit(root, 'code', (node, index, parent) => {
            if (index === undefined) {
                return;
            }
            if (parent?.type !== 'mdxJsxFlowElement' || !names.has(parent.name as string)) {
                return CONTINUE;
            }
            if (currentParent !== parent) {
                currentAttributes.splice(0, currentAttributes.length);
                currentParent = parent;
            }
            return transform(node, parent, index);
        });
    };
};

export default plugin;
