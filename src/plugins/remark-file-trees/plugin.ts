import type { Expression, ObjectExpression, Property } from 'estree';
import type { List, ListItem, Root } from 'mdast';
import { type ContainerDirective } from 'mdast-util-directive';
import type { MdxjsEsm, MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Plugin, Transformer } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import type { DirType } from '../../components/FileSystem/Dir';
import { toJsxAttribute, toMdxJsxExpressionAttribute, transformAttributes } from '../helpers';

const DIR_SOURCE = '@tdev-components/FileSystem/Dir';

const literal = (value: string): Expression => ({ type: 'Literal', value, raw: JSON.stringify(value) });

const property = (name: string, value: Expression): Property => ({
    type: 'Property',
    key: { type: 'Identifier', name },
    value,
    kind: 'init',
    method: false,
    shorthand: false,
    computed: false
});

const dirExpression = (dir: DirType): ObjectExpression => ({
    type: 'ObjectExpression',
    properties: [
        property('name', literal(dir.name)),
        property('children', {
            type: 'ArrayExpression',
            elements: dir.children.map((child) =>
                typeof child === 'string' ? literal(child) : dirExpression(child)
            )
        })
    ]
});

const listItem = (item: ListItem, file: VFile): DirType | string => {
    const [label, children, ...extra] = item.children;
    if (
        item.checked != null ||
        label?.type !== 'paragraph' ||
        (children && children.type !== 'list') ||
        extra.length > 0
    ) {
        file.fail(
            'Tree items must contain a name and at most one nested list.',
            item,
            'remark-file-trees:invalid-tree'
        );
    }
    const name = label.children
        .map((child) => {
            if (child.type !== 'text' && child.type !== 'inlineCode') {
                file.fail(
                    'Tree names support only plain text and inline code.',
                    child,
                    'remark-file-trees:invalid-tree'
                );
            }
            return child.value;
        })
        .join('');
    if (!name.trim()) {
        file.fail('Tree items must have a nonempty name.', item, 'remark-file-trees:invalid-tree');
    }
    return children ? { name, children: listChildren(children as List, file) } : name;
};

const listChildren = (list: List, file: VFile): DirType['children'] =>
    list.children.map((item) => listItem(item, file));

// Keep the source and ESTree import in sync, as in remark-mdi.
const importStatement: () => MdxjsEsm = () => ({
    type: 'mdxjsEsm',
    value: `import Dir from '${DIR_SOURCE}';`,
    data: {
        estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
                {
                    type: 'ImportDeclaration',
                    attributes: [],
                    specifiers: [
                        { type: 'ImportDefaultSpecifier', local: { type: 'Identifier', name: 'Dir' } }
                    ],
                    source: { type: 'Literal', value: DIR_SOURCE, raw: `'${DIR_SOURCE}'` }
                }
            ]
        }
    }
});

const fail = (file: VFile, node: ContainerDirective, message: string) => {
    file.fail(message, node, 'remark-file-trees:invalid-tree');
};

const plugin: Plugin<[], Root> = function plugin(): Transformer<Root> {
    return (root, file) => {
        let hasTree = false;
        visit(root, 'containerDirective', (node, index, parent) => {
            if (node.name !== 'tree' || !parent || index === undefined) {
                return;
            }
            if (node.children.length !== 1 || node.children[0].type !== 'list') {
                fail(file, node, 'A tree directive must contain exactly one Markdown list.');
            }
            const children = listChildren(node.children[0] as List, file);
            if (children.length === 0) {
                fail(file, node, 'A tree list must contain at least one item.');
            }
            const first = children[0];
            const dir: DirType =
                children.length === 1
                    ? typeof first === 'string'
                        ? { name: first, children: [] }
                        : first
                    : { name: '/', children };
            const attributes = transformAttributes(node.attributes, {}).attributes;
            const openLevel = attributes.openLevel;
            if (
                openLevel !== undefined &&
                (typeof openLevel !== 'number' || !Number.isInteger(openLevel) || openLevel < 0)
            ) {
                fail(file, node, 'The tree openLevel attribute must be a nonnegative integer.');
            }
            const tree: MdxJsxFlowElement = {
                type: 'mdxJsxFlowElement',
                name: 'Dir',
                attributes: [
                    toMdxJsxExpressionAttribute('dir', dir, dirExpression(dir)),
                    toJsxAttribute('open', openLevel ?? true)
                ],
                children: []
            };
            if (attributes.maxHeight !== undefined) {
                const maxHeight = attributes.maxHeight;
                if (
                    (typeof maxHeight !== 'string' && maxHeight !== 0) ||
                    (typeof maxHeight === 'string' && !maxHeight.trim())
                ) {
                    fail(
                        file,
                        node,
                        'The tree maxHeight attribute must be a CSS height (e.g. 240px, 20rem, 50vh, none or 0).'
                    );
                }
                tree.attributes.push(toJsxAttribute('maxHeight', String(maxHeight)));
            }
            hasTree = true;
            parent.children.splice(index, 1, tree);
            return SKIP;
        });
        if (hasTree) {
            let includesDir = false;
            visit(root, 'mdxjsEsm', (node) => {
                includesDir ||= !!node.data?.estree?.body.some(
                    (statement) =>
                        statement.type === 'ImportDeclaration' &&
                        statement.source.value === DIR_SOURCE &&
                        statement.specifiers.some(
                            (specifier) =>
                                specifier.local.name === 'Dir' &&
                                (specifier.type === 'ImportDefaultSpecifier' ||
                                    (specifier.type === 'ImportSpecifier' &&
                                        specifier.imported.type === 'Identifier' &&
                                        specifier.imported.name === 'default'))
                        )
                );
            });
            if (!includesDir) {
                root.children.unshift(importStatement());
            }
        }
    };
};

export default plugin;
