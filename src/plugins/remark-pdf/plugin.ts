import { visit } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import type { MdxJsxFlowElement, MdxjsEsm } from 'mdast-util-mdx';
import type { LeafDirective } from 'mdast-util-directive';
import { requireDefaultMdastNode, toJsxAttribute, transformAttributes } from '../helpers';
import { Parent, Text } from 'mdast';
import path from 'path';

const IMPORT_PDF_REACT_NODE: MdxjsEsm = {
    type: 'mdxjsEsm',
    value: "import PdfViewer from '@tdev-components/PdfViewer';",
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
                                name: 'PdfViewer'
                            }
                        }
                    ],
                    source: {
                        type: 'Literal',
                        value: '@tdev-components/PdfViewer',
                        raw: "'@tdev-components/PdfViewer'"
                    }
                }
            ],
            sourceType: 'module',
            comments: []
        }
    }
};

const PdfViewerNode = (
    src: string,
    attr: { [key: string]: string | number | boolean | string | undefined }
): MdxJsxFlowElement => {
    return {
        type: 'mdxJsxFlowElement',
        name: 'PdfViewer',
        attributes: [
            toJsxAttribute('name', path.basename(src)),
            attr.scroll !== undefined && toJsxAttribute('scroll', attr.scroll),
            attr.page !== undefined && toJsxAttribute('page', attr.page),
            attr.width !== undefined && toJsxAttribute('width', attr.width),
            attr.minWidth !== undefined && toJsxAttribute('minWidth', attr.minWidth),
            attr.noDownload !== undefined && toJsxAttribute('noDownload', attr.noDownload),
            attr.scale !== undefined && toJsxAttribute('scale', attr.scale),
            requireDefaultMdastNode('file', src)
        ].filter((attr) => !!attr),
        children: []
    };
};

const plugin: Plugin = function plugin(this: Processor, optionsInput?: {}): Transformer {
    return async (ast, vfile) => {
        let hasPdf = false;

        visit(ast, (node, idx, parent: Parent) => {
            if (
                node.type !== 'leafDirective' ||
                (node as unknown as LeafDirective).name !== 'pdf' ||
                idx === undefined
            ) {
                return;
            }
            hasPdf = true;
            const directive = node as unknown as LeafDirective;
            const src = (directive.children[0] as Text).value;
            const rawAttributes = transformAttributes(directive.attributes || {}, {});
            parent.children.splice(idx, 1, PdfViewerNode(src, rawAttributes.attributes));
        });

        if (hasPdf) {
            (ast as unknown as Parent).children.unshift(IMPORT_PDF_REACT_NODE);
        }
    };
};

export default plugin;
