import type { Root } from 'mdast';
import { directiveFromMarkdown } from 'mdast-util-directive';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown, frontmatterToMarkdown } from 'mdast-util-frontmatter';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { mathFromMarkdown, mathToMarkdown } from 'mdast-util-math';
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx';
import { toMarkdown, type Options as ToMarkdownOptions } from 'mdast-util-to-markdown';
import { frontmatter } from 'micromark-extension-frontmatter';
import { gfm } from 'micromark-extension-gfm';
import { math } from 'micromark-extension-math';
import { mdxjs } from 'micromark-extension-mdxjs';
import { customToMarkdown } from './customNodes';
import { directiveSyntax, directiveToMarkdownAtWordBoundary } from './textDirective';

/**
 * The markdown dialect understood by the editor. It mirrors the syntax
 * Docusaurus + Teaching-Dev accept: MDX, GFM, directives, math and yaml frontmatter.
 */
export const parseMdx = (source: string): Root => {
    return fromMarkdown(source, {
        extensions: [mdxjs(), gfm(), directiveSyntax(), math(), frontmatter(['yaml'])],
        mdastExtensions: [
            mdxFromMarkdown(),
            gfmFromMarkdown(),
            directiveFromMarkdown(),
            mathFromMarkdown(),
            frontmatterFromMarkdown(['yaml'])
        ]
    });
};

const TO_MARKDOWN_OPTIONS: ToMarkdownOptions = {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    rule: '-',
    fences: true,
    extensions: [
        mdxToMarkdown(),
        gfmToMarkdown(),
        directiveToMarkdownAtWordBoundary(),
        mathToMarkdown(),
        frontmatterToMarkdown(['yaml']),
        customToMarkdown
    ]
};

/**
 * Serializes a single mdast node (and its subtree) to markdown, without the trailing newline.
 */
export const stringifyMdast = (node: Root | Root['children'][number]): string => {
    const root: Root = node.type === 'root' ? node : { type: 'root', children: [node] };
    return toMarkdown(root, TO_MARKDOWN_OPTIONS).replace(/\n$/, '');
};
