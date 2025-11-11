import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { MdxJsxFlowElement, MdxjsEsm } from 'mdast-util-mdx';
import { requireDefaultMdastNode, toJsxAttribute, transformAttributes } from '@tdev/core/src/plugins/helpers';
import { Root, Text } from 'mdast';
import path from 'path';

const IMPORT_PDF_REACT_NODE: MdxjsEsm = {
    type: 'mdxjsEsm',
    value: "import PdfViewer from '@tdev/remark-pdf/PdfViewer';",
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
                    attributes: [],
                    source: {
                        type: 'Literal',
                        value: '@tdev/remark-pdf/PdfViewer',
                        raw: "'@tdev/remark-pdf/PdfViewer'"
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
            attr.maxHeight !== undefined && toJsxAttribute('maxHeight', attr.maxHeight),
            attr.minWidth !== undefined && toJsxAttribute('minWidth', attr.minWidth),
            attr.noDownload !== undefined && toJsxAttribute('noDownload', attr.noDownload),
            attr.scale !== undefined && toJsxAttribute('scale', attr.scale),
            requireDefaultMdastNode('file', src)
        ].filter((attr) => !!attr),
        children: []
    };
};

const plugin: Plugin<unknown[], Root> = function plugin(): Transformer<Root> {
    return async (ast, vfile) => {
        let hasPdf = false;

        visit(ast, 'leafDirective', (node, idx, parent) => {
            if (node.name !== 'pdf' || idx === undefined || !parent) {
                return;
            }
            hasPdf = true;
            const src = (node.children[0] as Text).value;
            const rawAttributes = transformAttributes(node.attributes || {}, {});
            parent.children.splice(idx, 1, PdfViewerNode(src, rawAttributes.attributes));
        });

        if (hasPdf) {
            ast.children.unshift(IMPORT_PDF_REACT_NODE);
        }
    };
};

export default plugin;
