import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { MdxJsxAttribute, MdxJsxTextElement, MdxjsEsm } from 'mdast-util-mdx';
import { camelCased, captialize, Options, toJsxAttribute, transformAttributes } from '../helpers';
import { Root, Text } from 'mdast';
import _ from 'es-toolkit/compat';

// const MDI_PROPS = [
//     {
//         name: 'title',
//         types: ['string'],
//         optional: true,
//         description: 'A11y <title>{title}</title>'
//     },
//     {
//         name: 'description',
//         types: ['string'],
//         optional: true,
//         description: 'A11y <desc>{desc}</desc>'
//     },
//     {
//         name: 'size',
//         types: ['number', 'string'],
//         optional: true,
//         description: '{size * 1.5}rem, 1em, 48px'
//     },
//     {
//         name: 'horizontal',
//         types: ['bool'],
//         optional: true,
//         description: 'Flip Horizontal'
//     },
//     {
//         name: 'vertical',
//         types: ['bool'],
//         optional: true,
//         description: 'Flip Vertical'
//     },
//     {
//         name: 'rotate',
//         types: ['number'],
//         optional: true,
//         description: 'degrees 0 to 360'
//     },
//     {
//         name: 'color',
//         types: ['string'],
//         optional: true,
//         description: 'rgb() / rgba() / #000'
//     },
//     {
//         name: 'spin',
//         types: ['number', 'bool'],
//         optional: true,
//         description: 'true = 2s, -2 counterclockwise, {spin}s'
//     },
//     {
//         name: 'className',
//         types: ['string'],
//         optional: true,
//         description: 'additional class names'
//     }
// ];

const IMPORT_MDI_REACT_NODE = {
    type: 'mdxjsEsm',
    value: "import Icon from '@mdi/react';",
    data: {
        estree: {
            type: 'Program',
            body: [
                {
                    type: 'ImportDeclaration',
                    specifiers: [
                        {
                            type: 'ImportDefaultSpecifier',
                            local: {
                                type: 'Identifier',
                                name: 'Icon'
                            }
                        }
                    ],
                    source: {
                        type: 'Literal',
                        value: '@mdi/react',
                        raw: "'@mdi/react'"
                    }
                }
            ],
            sourceType: 'module',
            comments: []
        }
    }
} as MdxjsEsm;

const IMPORT_MDI_ICONS = (icons: string[]): MdxjsEsm => {
    return {
        type: 'mdxjsEsm',
        value: `import { ${icons.join(', ')} } from '@mdi/js';`,
        data: {
            estree: {
                type: 'Program',
                body: [
                    {
                        type: 'ImportDeclaration',
                        specifiers: icons.map((icon) => ({
                            type: 'ImportSpecifier',
                            imported: {
                                type: 'Identifier',
                                name: icon
                            },
                            local: {
                                type: 'Identifier',
                                name: icon
                            }
                        })),
                        source: {
                            type: 'Literal',
                            value: '@mdi/js',
                            raw: "'@mdi/js'"
                        }
                    }
                ],
                sourceType: 'module',
                comments: []
            }
        }
    };
};

interface OptionsInput {
    colorMapping?: Record<string, string>;
    defaultSize?: number | string;
}

export const transformMdiAttributes = (options: Options, optionsInput: OptionsInput = {}) => {
    const rawAttributes = _.cloneDeep(options);
    if (!('size' in rawAttributes.attributes)) {
        delete rawAttributes.style['size'];
        rawAttributes.attributes.size = optionsInput?.defaultSize || 1.5;
    }
    if ('color' in rawAttributes.attributes) {
        delete rawAttributes.style['color'];
        const color = rawAttributes.attributes.color as string;
        if (optionsInput?.colorMapping && color in optionsInput.colorMapping) {
            rawAttributes.attributes.color = optionsInput.colorMapping[color];
        }
    }
    if (
        'className' in rawAttributes.attributes &&
        !/mdi-icon/.test(rawAttributes.attributes.className as string)
    ) {
        rawAttributes.attributes.className = `mdi-icon ${rawAttributes.attributes.className}`;
    } else {
        rawAttributes.attributes.className = 'mdi-icon';
    }
    return rawAttributes;
};

const plugin: Plugin<OptionsInput[], Root> = function plugin(optionsInput = {}): Transformer<Root> {
    return async (root) => {
        let hasMdiIcons = false;
        const includedMdiIcons = new Set();
        const newMdiIcons = new Set<string>();
        let includesIcon = false;

        visit(root, ['textDirective', 'mdxjsEsm'], (node, idx, parent) => {
            if (node.type === 'mdxjsEsm') {
                if (/import.*(Icon|{.*default\s+as\s+\w+.*}).*from '@mdi\/react'/.test(node.value || '')) {
                    includesIcon = true;
                }
                if (/import.*{(.*)}.*from\s+'@mdi\/js'/.test(node.value || '')) {
                    const match = node.value.match(/import.*{(.*)}.*from\s+'@mdi\/js'/);
                    if (match) {
                        match[1].split(',').forEach((s) => {
                            const ico = s.trim();
                            if (ico.startsWith('mdi')) {
                                includedMdiIcons.add(ico);
                            }
                        });
                    }
                }
                return;
            }
            if (node.type !== 'textDirective' || !parent || idx === undefined) {
                return;
            }
            if (node.name !== 'mdi') {
                return;
            }
            hasMdiIcons = true;
            const icon = (node.children[0] as Text).value;
            const mdiIcon = `mdi${captialize(camelCased(icon))}`;
            if (!includedMdiIcons.has(mdiIcon)) {
                newMdiIcons.add(mdiIcon);
            }
            const parsedAttributes = transformAttributes(node.attributes || {});
            const rawAttributes = transformMdiAttributes(parsedAttributes, optionsInput);
            const attributes = Object.entries(rawAttributes.attributes).map(([key, value]) =>
                toJsxAttribute(key, value)
            );

            const iconNode: MdxJsxTextElement = {
                name: 'Icon',
                type: 'mdxJsxTextElement',
                attributes: [
                    {
                        type: 'mdxJsxAttribute',
                        name: 'path',
                        value: {
                            type: 'mdxJsxAttributeValueExpression',
                            value: mdiIcon,
                            data: {
                                estree: {
                                    type: 'Program',
                                    body: [
                                        {
                                            type: 'ExpressionStatement',
                                            expression: {
                                                type: 'Identifier',
                                                name: mdiIcon
                                            }
                                        }
                                    ],
                                    sourceType: 'module'
                                }
                            }
                        }
                    },
                    ...attributes
                ],
                children: []
            };
            (parent.children as any)[idx] = iconNode;
        });

        if (hasMdiIcons && !includesIcon) {
            root.children.unshift(IMPORT_MDI_REACT_NODE);
        }
        if (newMdiIcons.size > 0) {
            root.children.unshift(IMPORT_MDI_ICONS([...newMdiIcons]));
        }
    };
};

export default plugin;
