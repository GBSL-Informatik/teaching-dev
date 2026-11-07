import type { PhrasingContent, TableRow } from 'mdast';
import type { Mark, Node } from 'prosemirror-model';
import type { ContainerFormat, DirectiveAttributes, JsxAttribute } from '../schema';
import { originalMarkdown, originalSeparator } from './origin';
import { stringifyMdast } from './syntax';

/**
 * Converts a ProseMirror document back to mdx.
 *
 * Unchanged nodes are written with their original markdown (see `origin.ts`), only changed
 * nodes are serialized again. The structure (directives, jsx, lists, blockquotes) is
 * serialized here, leaf blocks and inline content are delegated to `mdast-util-to-markdown`.
 */
export const serializeMarkdown = (doc: Node, trailing: string = '\n'): string => {
    const body = new ProseMirrorToMarkdown().blocks(childrenOf(doc), 2);
    return `${body}${trailing}`;
};

const DEFAULT_JSX_FORMAT: ContainerFormat = { childIndent: '  ', leading: 1, trailing: 1 };
const DEFAULT_DIRECTIVE_FORMAT: ContainerFormat = { childIndent: '', leading: 1, trailing: 1 };

class ProseMirrorToMarkdown {
    /**
     * Joins block nodes. The separators between unchanged siblings are taken from the
     * original source, otherwise `defaultLineBreaks` are used. The blocks are indented by `indent`,
     * separators are kept as they are.
     */
    blocks(nodes: Node[], defaultLineBreaks: number, indent: string = ''): string {
        const nonEmpty = nodes.filter((node) => !isEmptyBlock(node));
        return nonEmpty
            .map((node, idx) => {
                const markdown = indentLines(this.block(node), mustNotIndent(node) ? '' : indent, true);
                if (idx === 0) {
                    return markdown;
                }
                const separator =
                    originalSeparator(nonEmpty[idx - 1], node) ?? '\n'.repeat(defaultLineBreaks);
                return `${separator}${markdown}`;
            })
            .join('');
    }

    private block(node: Node): string {
        const original = originalMarkdown(node);
        if (original !== undefined) {
            return original;
        }
        switch (node.type.name) {
            case 'paragraph':
                return stringifyMdast({ type: 'paragraph', children: this.phrasing(node) });
            case 'heading':
                return stringifyMdast({
                    type: 'heading',
                    depth: node.attrs.level,
                    children: this.phrasing(node)
                });
            case 'blockquote':
                return this.blockquote(node);
            case 'bullet_list':
            case 'ordered_list':
                return this.list(node);
            case 'code_block':
                return stringifyMdast({
                    type: 'code',
                    lang: node.attrs.lang || null,
                    meta: node.attrs.meta || null,
                    value: node.textContent
                });
            case 'math_block':
                return stringifyMdast({ type: 'math', value: node.textContent });
            case 'thematic_break':
                return '---';
            case 'frontmatter':
                return `---\n${node.textContent}\n---`;
            case 'table':
                return this.table(node);
            case 'container_directive':
                return this.containerDirective(node);
            case 'leaf_directive':
                return `::${node.attrs.name}${directiveLabel(node.attrs.label)}${directiveAttributes(node.attrs.attributes)}`;
            case 'jsx_flow':
                return this.jsxFlow(node);
            case 'jsx_flow_void':
                return (
                    node.attrs.format?.openingTag ??
                    `<${node.attrs.name}${jsxAttributes(node.attrs.attributes)} />`
                );
            case 'footnote_definition':
                const content = this.blocks(childrenOf(node), 2);
                return `[^${node.attrs.label}]: ${indentLines(content, '    ')}`;
            default:
                return node.textContent;
        }
    }

    private blockquote(node: Node) {
        const content = this.blocks(childrenOf(node), 2);
        return content
            .split('\n')
            .map((line) => (line ? `> ${line}` : '>'))
            .join('\n');
    }

    /**
     * The list markers are always serialized, since the numbering of an ordered list
     * changes when items are moved. The content of the items is reused when unchanged.
     */
    private list(node: Node) {
        const { tight, bullet, start, delimiter } = node.attrs;
        const items = childrenOf(node);
        return items
            .map((item, idx) => {
                const marker =
                    node.type.name === 'ordered_list' ? `${start + idx}${delimiter} ` : `${bullet} `;
                const markdown = this.listItem(item, marker, tight);
                if (idx === 0) {
                    return markdown;
                }
                const separator = originalSeparator(items[idx - 1], item) ?? (tight ? '\n' : '\n\n');
                return `${separator}${markdown}`;
            })
            .join('');
    }

    private listItem(item: Node, marker: string, tight: boolean) {
        const checked = item.attrs.checked;
        const task = checked === null ? '' : checked ? '[x] ' : '[ ] ';
        const content = this.blocks(childrenOf(item), tight ? 1 : 2);
        return `${marker}${task}${indentLines(content, ' '.repeat(marker.length))}`.trimEnd();
    }

    private table(node: Node) {
        const rows = childrenOf(node);
        const align = childrenOf(rows[0]).map((cell) => cell.attrs.align);
        return stringifyMdast({
            type: 'table',
            align,
            children: rows.map((row): TableRow => ({
                type: 'tableRow',
                children: childrenOf(row).map((cell) => ({
                    type: 'tableCell',
                    children: this.phrasing(cell)
                }))
            }))
        });
    }

    private containerDirective(node: Node) {
        const [first, ...rest] = childrenOf(node);
        const hasLabel = first.type.name === 'directive_label';
        const label = hasLabel ? stringifyMdast({ type: 'paragraph', children: this.phrasing(first) }) : '';
        const format: ContainerFormat = node.attrs.format ?? DEFAULT_DIRECTIVE_FORMAT;
        const fence = ':'.repeat(Math.max(format.fence ?? 3, innerDirectiveFence(node) + 1));
        const opening = `${fence}${node.attrs.name}${directiveLabel(label)}${directiveAttributes(node.attrs.attributes)}`;
        const children = this.blocks(hasLabel ? rest : [first, ...rest], 2, format.childIndent);
        return this.container(opening, children, fence, format);
    }

    /**
     * An element without content is written as self-closing tag, e.g. `<String />`.
     */
    private jsxFlow(node: Node) {
        const { name, attributes } = node.attrs;
        const format: ContainerFormat = node.attrs.format ?? DEFAULT_JSX_FORMAT;
        const opening = format.openingTag ?? `<${name}${jsxAttributes(attributes)}>`;
        const children = childrenOf(node);
        if (children.every(isEmptyBlock)) {
            return `${opening.replace(/\s*\/?>$/, '')} />`;
        }
        const content = this.blocks(children, 2, format.childIndent);
        return this.container(opening, content, `</${name}>`, format);
    }

    private container(opening: string, children: string, closing: string, format: ContainerFormat) {
        return `${opening}${'\n'.repeat(format.leading)}${children}${'\n'.repeat(format.trailing)}${closing}`;
    }

    /**
     * Converts the inline content of a textblock to mdast. Marks are sorted by their rank
     * in the schema, so consecutive nodes sharing the same leading marks share the same mdast parent.
     */
    private phrasing(textblock: Node): PhrasingContent[] {
        const root: PhrasingContent[] = [];
        const open: { mark: Mark; children: PhrasingContent[] }[] = [];
        textblock.forEach((child) => {
            const marks = child.marks.filter((mark) => mark.type.name !== 'code');
            let shared = 0;
            while (shared < open.length && shared < marks.length && open[shared].mark.eq(marks[shared])) {
                shared++;
            }
            open.length = shared;
            for (const mark of marks.slice(shared)) {
                const parent = open.at(-1)?.children ?? root;
                const mdast = markToMdast(mark);
                parent.push(mdast);
                open.push({ mark, children: mdast.children });
            }
            (open.at(-1)?.children ?? root).push(this.inlineNode(child));
        });
        return moveWhitespaceOutOfMarks(root);
    }

    private inlineNode(node: Node): PhrasingContent {
        const original = originalMarkdown(node);
        if (original !== undefined) {
            return { type: 'verbatim', value: original };
        }
        switch (node.type.name) {
            case 'text':
                const isCode = node.marks.some((mark) => mark.type.name === 'code');
                return isCode
                    ? { type: 'inlineCode', value: node.text! }
                    : { type: 'text', value: node.text! };
            case 'hard_break':
                return { type: 'break' };
            case 'image':
                return { type: 'image', url: node.attrs.src, alt: node.attrs.alt, title: node.attrs.title };
            case 'math_inline':
                return { type: 'inlineMath', value: node.attrs.value };
            case 'footnote_reference':
                const { label } = node.attrs;
                return { type: 'footnoteReference', identifier: label.toLowerCase(), label };
            case 'text_directive':
                const { name, attributes } = node.attrs;
                const markdown = `:${name}${directiveLabel(node.attrs.label)}${directiveAttributes(attributes)}`;
                return { type: 'verbatim', value: markdown };
            default:
                return { type: 'verbatim', value: node.attrs.value ?? '' };
        }
    }
}

type MdastParent = Extract<PhrasingContent, { children: PhrasingContent[] }>;

const markToMdast = (mark: Mark): MdastParent => {
    switch (mark.type.name) {
        case 'link':
            return { type: 'link', url: mark.attrs.href, title: mark.attrs.title, children: [] };
        case 'strong':
        case 'emphasis':
        case 'delete':
        case 'box':
        case 'kbd':
            return { type: mark.type.name, children: [] } as MdastParent;
        default:
            throw new Error(`Unknown mark "${mark.type.name}"`);
    }
};

const FORMATTING_TYPES = new Set(['strong', 'emphasis', 'delete', 'box', 'kbd']);

/**
 * Markdown formatting can not start or end with whitespace (`** bold**` is not bold),
 * so leading and trailing whitespace is moved out of the formatting.
 */
const moveWhitespaceOutOfMarks = (nodes: PhrasingContent[]): PhrasingContent[] => {
    return nodes.flatMap((node): PhrasingContent[] => {
        if (!('children' in node)) {
            return [node];
        }
        node.children = moveWhitespaceOutOfMarks(node.children);
        if (!FORMATTING_TYPES.has(node.type)) {
            return [node];
        }
        const first = node.children[0];
        const leading = first?.type === 'text' ? first.value.match(/^\s+/)?.[0] : undefined;
        if (first?.type === 'text' && leading) {
            first.value = first.value.slice(leading.length);
        }
        const last = node.children.at(-1);
        const trailing = last?.type === 'text' ? last.value.match(/\s+$/)?.[0] : undefined;
        if (last?.type === 'text' && trailing) {
            last.value = last.value.slice(0, -trailing.length);
        }
        node.children = node.children.filter((child) => child.type !== 'text' || child.value);
        return [
            ...(leading ? [{ type: 'text', value: leading } as const] : []),
            ...(node.children.length > 0 ? [node] : []),
            ...(trailing ? [{ type: 'text', value: trailing } as const] : [])
        ];
    });
};

const childrenOf = (node: Node): Node[] => {
    const children: Node[] = [];
    node.forEach((child) => children.push(child));
    return children;
};

/** esm (`import`/`export`) is only recognized when it starts at the beginning of a line */
const mustNotIndent = (node: Node) => {
    return node.type.name === 'raw_block' && node.attrs.kind === 'mdxjsEsm';
};

const isEmptyBlock = (node: Node) => {
    return node.type.name === 'paragraph' && node.content.size === 0;
};

/**
 * Indents all lines except the first (unless `includeFirst` is set). Empty lines are not indented.
 */
const indentLines = (text: string, indent: string, includeFirst: boolean = false) => {
    if (!indent) {
        return text;
    }
    return text
        .split('\n')
        .map((line, idx) => (line && (idx > 0 || includeFirst) ? `${indent}${line}` : line))
        .join('\n');
};

const innerDirectiveFence = (node: Node) => {
    let fence = 0;
    node.descendants((child) => {
        if (child.type.name === 'container_directive') {
            const own = child.attrs.format?.fence ?? 3;
            fence = Math.max(fence, own, innerDirectiveFence(child) + 1);
            return false;
        }
        return true;
    });
    return fence;
};

const directiveLabel = (label: string) => (label ? `[${label}]` : '');

const SIMPLE_VALUE = /^[\w-]+$/;

export const directiveAttributes = (attributes: DirectiveAttributes): string => {
    const parts = Object.entries(attributes).flatMap(([key, value]) => {
        if (key === 'id' && SIMPLE_VALUE.test(value)) {
            return [`#${value}`];
        }
        if (key === 'class' && value.split(/\s+/).every((name) => SIMPLE_VALUE.test(name))) {
            return value.split(/\s+/).map((name) => `.${name}`);
        }
        if (value === '') {
            return [key];
        }
        return [`${key}=${quote(value)}`];
    });
    return parts.length > 0 ? `{${parts.join(' ')}}` : '';
};

export const jsxAttributes = (attributes: JsxAttribute[]): string => {
    return attributes
        .map((attribute) => {
            switch (attribute.type) {
                case 'spread':
                    return ` {${attribute.value}}`;
                case 'expressionAttribute':
                    return ` ${attribute.name}={${attribute.value}}`;
                case 'attribute':
                    return attribute.value === null
                        ? ` ${attribute.name}`
                        : ` ${attribute.name}=${quote(attribute.value)}`;
            }
        })
        .join('');
};

const quote = (value: string) => {
    if (!value.includes('"')) {
        return `"${value}"`;
    }
    if (!value.includes("'")) {
        return `'${value}'`;
    }
    return `"${value.replaceAll('"', '&quot;')}"`;
};
