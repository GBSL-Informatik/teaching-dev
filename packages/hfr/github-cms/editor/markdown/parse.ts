import type {
    BlockContent,
    Code,
    DefinitionContent,
    FootnoteDefinition,
    Heading,
    List,
    ListItem,
    Nodes,
    Paragraph,
    PhrasingContent,
    Root,
    RootContent,
    Table
} from 'mdast';
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive';
import type { MdxJsxAttribute, MdxJsxExpressionAttribute, MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import type { Mark, Node } from 'prosemirror-model';
import {
    type ContainerFormat,
    type DirectiveAttributes,
    ITEMS_DIRECTIVES,
    type JsxAttribute,
    schema
} from '../schema';
import { rawImageAlt } from './imageAlt';
import { groupKbd } from './kbd';
import { countLineBreaks, dedent, setOrigin } from './origin';
import { parseMdx, stringifyMdast } from './syntax';

/** the children of a container directive */
type FlowContent = BlockContent | DefinitionContent;

export interface ParsedMarkdown {
    doc: Node;
    /** whitespace after the last node, usually a single line break */
    trailing: string;
}

/**
 * Converts mdx source to a ProseMirror document.
 * Throws when the source is not valid mdx.
 */
export const parseMarkdown = (source: string): ParsedMarkdown => {
    const root = parseMdx(source);
    const parser = new MdastToProseMirror(source);
    const doc = parser.root(root);
    const lastEnd = root.children.at(-1)?.position?.end.offset ?? 0;
    return { doc, trailing: source.slice(lastEnd) };
};

class MdastToProseMirror {
    private readonly source: string;

    constructor(source: string) {
        this.source = source;
    }

    root(root: Root): Node {
        return schema.topNodeType.createAndFill(null, this.blocks(root.children))!;
    }

    private blocks(children: (RootContent | BlockContent | DefinitionContent)[]): Node[] {
        return children.map((child) => {
            const node = this.block(child);
            setOrigin(node, this.source, child.position);
            return node;
        });
    }

    private block(node: RootContent): Node {
        switch (node.type) {
            case 'paragraph':
                return schema.nodes.paragraph.create(null, this.inline(node.children));
            case 'heading':
                return this.heading(node);
            case 'blockquote':
                return schema.nodes.blockquote.create(null, this.blocks(node.children));
            case 'list':
                return this.list(node);
            case 'code':
                return this.code(node);
            case 'math':
                return schema.nodes.math_block.create(null, this.text(node.value));
            case 'thematicBreak':
                return schema.nodes.thematic_break.create();
            case 'table':
                return this.table(node);
            case 'yaml':
                return schema.nodes.frontmatter.create(null, this.text(node.value));
            case 'containerDirective':
                return this.containerDirective(node);
            case 'leafDirective':
                return this.leafDirective(node);
            case 'mdxJsxFlowElement':
                return this.jsxFlow(node);
            case 'footnoteDefinition':
                return this.footnoteDefinition(node);
            default:
                return schema.nodes.raw_block.create({ kind: node.type }, this.text(this.sourceOf(node)));
        }
    }

    private heading(node: Heading) {
        return schema.nodes.heading.create({ level: node.depth }, this.inline(node.children));
    }

    private list(node: List) {
        const tight = !node.spread && node.children.every((item) => !item.spread);
        const items = node.children.map((item) => {
            const listItem = this.listItem(item);
            setOrigin(listItem, this.source, item.position);
            return listItem;
        });
        if (node.ordered) {
            const delimiter = this.sourceOf(node).match(/^\d+([.)])/)?.[1] ?? '.';
            return schema.nodes.ordered_list.create({ tight, start: node.start ?? 1, delimiter }, items);
        }
        const bullet = this.sourceOf(node).charAt(0);
        return schema.nodes.bullet_list.create({ tight, bullet }, items);
    }

    private listItem(item: ListItem) {
        return schema.nodes.list_item.createAndFill(
            { checked: item.checked ?? null },
            this.blocks(item.children)
        )!;
    }

    private code(node: Code) {
        return schema.nodes.code_block.create(
            { lang: node.lang || '', meta: node.meta || '' },
            this.text(node.value)
        );
    }

    private table(node: Table) {
        const rows = node.children.map((row, rowIdx) => {
            const cellType = rowIdx === 0 ? schema.nodes.table_header : schema.nodes.table_cell;
            const cells = row.children.map((cell, colIdx) =>
                cellType.create({ align: node.align?.[colIdx] ?? null }, this.inline(cell.children))
            );
            return schema.nodes.table_row.create(null, cells);
        });
        return schema.nodes.table.create(null, rows);
    }

    private containerDirective(node: ContainerDirective) {
        const [first, ...rest] = node.children;
        const hasLabel = first?.type === 'paragraph' && first.data?.directiveLabel;
        const label = hasLabel
            ? schema.nodes.directive_label.create(null, this.inline(first.children))
            : null;
        const content = hasLabel ? rest : node.children;
        const fence = this.sourceOf(node).match(/^:+/)?.[0].length ?? 3;
        const openingEnd = this.source.indexOf('\n', node.position?.start.offset);
        const isItemsDirective = ITEMS_DIRECTIVES.includes(node.name);
        const type = isItemsDirective ? schema.nodes.items_directive : schema.nodes.container_directive;
        const children = isItemsDirective ? this.directiveItems(content) : this.blocks(content);
        return type.createAndFill(
            {
                name: node.name,
                attributes: directiveAttributes(node),
                format: this.containerFormat(node, content, openingEnd, { fence })
            },
            label ? [label, ...children] : children
        )!;
    }

    /** each `::br` starts a new item, the first item can omit it */
    private directiveItems(children: FlowContent[]): Node[] {
        const items: { itemBreak: LeafDirective | null; children: FlowContent[] }[] = [];
        for (const child of children) {
            if (child.type === 'leafDirective' && child.name === 'br') {
                items.push({ itemBreak: child, children: [] });
            } else if (items.length === 0) {
                items.push({ itemBreak: null, children: [child] });
            } else {
                items.at(-1)!.children.push(child);
            }
        }
        return items.map(({ itemBreak, children }) => this.directiveItem(itemBreak, children));
    }

    private directiveItem(itemBreak: LeafDirective | null, children: FlowContent[]) {
        const firstChild = children[0]?.position;
        const leading =
            itemBreak?.position && firstChild
                ? countLineBreaks(this.source.slice(itemBreak.position.end.offset, firstChild.start.offset))
                : null;
        const item = schema.nodes.directive_item.createAndFill(
            {
                label: itemBreak ? this.labelMarkdown(itemBreak.children) : '',
                attributes: itemBreak ? directiveAttributes(itemBreak) : {},
                explicitBreak: !!itemBreak,
                format: leading ? { leading } : null
            },
            this.blocks(children)
        )!;
        const start = (itemBreak ?? children[0])?.position?.start;
        const end = (children.at(-1) ?? itemBreak)?.position?.end;
        if (start && end) {
            setOrigin(item, this.source, { start, end });
        }
        return item;
    }

    private leafDirective(node: LeafDirective) {
        return schema.nodes.leaf_directive.create({
            name: node.name,
            label: this.labelMarkdown(node.children),
            attributes: directiveAttributes(node)
        });
    }

    private jsxFlow(node: MdxJsxFlowElement) {
        const indent = (node.position?.start.column ?? 1) - 1;
        const attrs = { name: node.name ?? '', attributes: jsxAttributes(node.attributes, indent) };
        if (node.children.length === 0) {
            const openingTag = dedent(this.sourceOf(node), indent);
            return schema.nodes.jsx_flow_void.create({
                ...attrs,
                format: { openingTag, childIndent: '', leading: 0, trailing: 0 }
            });
        }
        const nodeStart = node.position?.start.offset ?? 0;
        const firstChildStart = node.children[0].position?.start.offset ?? nodeStart;
        const rawOpeningTag = this.source.slice(nodeStart, firstChildStart).trimEnd();
        const format = this.containerFormat(node, node.children, nodeStart + rawOpeningTag.length, {
            openingTag: dedent(rawOpeningTag, indent)
        });
        return schema.nodes.jsx_flow.createAndFill({ ...attrs, format }, this.blocks(node.children))!;
    }

    private footnoteDefinition(node: FootnoteDefinition) {
        return schema.nodes.footnote_definition.createAndFill(
            { label: node.label ?? node.identifier },
            this.blocks(node.children)
        )!;
    }

    /**
     * Captures how the children of a container are laid out in the source.
     */
    private containerFormat(
        node: Nodes,
        children: Nodes[],
        openingEnd: number,
        format: Partial<ContainerFormat>
    ): ContainerFormat | null {
        const first = children[0]?.position;
        const last = children.at(-1)?.position;
        const { start, end } = node.position ?? {};
        if (!first || !last || !start || end?.offset === undefined) {
            return null;
        }
        const closingLineStart = this.source.lastIndexOf('\n', end.offset - 1);
        return {
            ...format,
            childIndent: ' '.repeat(Math.max(first.start.column - start.column, 0)),
            leading: countLineBreaks(this.source.slice(openingEnd, first.start.offset)) || 1,
            trailing: countLineBreaks(this.source.slice(last.end.offset, closingLineStart + 1)) || 1
        };
    }

    private inline(children: PhrasingContent[], marks: readonly Mark[] = []): Node[] {
        return groupKbd(children).flatMap((child) => this.phrasing(child, marks));
    }

    private phrasing(node: PhrasingContent, marks: readonly Mark[]): Node[] {
        switch (node.type) {
            case 'text':
                return this.text(node.value, marks);
            case 'kbd':
                return this.inline(node.children, schema.marks.kbd.create().addToSet(marks));
            case 'strong':
                const isBox = this.sourceOf(node).startsWith('__');
                const mark = isBox ? schema.marks.box.create() : schema.marks.strong.create();
                return this.inline(node.children, mark.addToSet(marks));
            case 'emphasis':
                return this.inline(node.children, schema.marks.emphasis.create().addToSet(marks));
            case 'delete':
                return this.inline(node.children, schema.marks.delete.create().addToSet(marks));
            case 'link':
                const link = schema.marks.link.create({ href: node.url, title: node.title ?? null });
                return this.inline(node.children, link.addToSet(marks));
            case 'inlineCode':
                return this.text(node.value, schema.marks.code.create().addToSet(marks));
            case 'break':
                return [schema.nodes.hard_break.create()];
            case 'image':
                const alt = rawImageAlt(this.sourceOf(node)) ?? node.alt ?? '';
                const image = { src: node.url, alt, title: node.title ?? null };
                return [this.withOrigin(node, schema.nodes.image.create(image, null, marks))];
            case 'inlineMath':
                return [
                    this.withOrigin(node, schema.nodes.math_inline.create({ value: node.value }, null, marks))
                ];
            case 'textDirective':
                return [this.withOrigin(node, this.textDirective(node, marks))];
            case 'footnoteReference':
                const label = node.label ?? node.identifier;
                return [
                    this.withOrigin(node, schema.nodes.footnote_reference.create({ label }, null, marks))
                ];
            default:
                return [schema.nodes.raw_inline.create({ value: this.sourceOf(node) }, null, marks)];
        }
    }

    private textDirective(node: TextDirective, marks: readonly Mark[]) {
        const attrs = {
            name: node.name,
            label: this.labelMarkdown(node.children),
            attributes: directiveAttributes(node)
        };
        return schema.nodes.text_directive.create(attrs, null, marks);
    }

    private text(value: string, marks?: readonly Mark[]): Node[] {
        if (!value) {
            return [];
        }
        return [schema.text(value, marks)];
    }

    private labelMarkdown(children: PhrasingContent[]): string {
        if (children.length === 0) {
            return '';
        }
        return stringifyMdast({ type: 'paragraph', children } satisfies Paragraph);
    }

    private withOrigin(mdast: Nodes, node: Node) {
        setOrigin(node, this.source, mdast.position);
        return node;
    }

    private sourceOf(node: Nodes): string {
        const { start, end } = node.position ?? {};
        if (start?.offset === undefined || end?.offset === undefined) {
            return '';
        }
        return this.source.slice(start.offset, end.offset);
    }
}

const directiveAttributes = (
    node: ContainerDirective | LeafDirective | TextDirective
): DirectiveAttributes => {
    const attributes: DirectiveAttributes = {};
    for (const [key, value] of Object.entries(node.attributes ?? {})) {
        attributes[key] = value ?? '';
    }
    return attributes;
};

/**
 * Multiline expressions are dedented by the indentation of the element, it is added again when serialized.
 */
const jsxAttributes = (
    attributes: (MdxJsxAttribute | MdxJsxExpressionAttribute)[],
    indent: number
): JsxAttribute[] => {
    return attributes.map((attribute): JsxAttribute => {
        if (attribute.type === 'mdxJsxExpressionAttribute') {
            return { type: 'spread', value: attribute.value };
        }
        if (attribute.value && typeof attribute.value === 'object') {
            const value = dedent(attribute.value.value, indent) ?? attribute.value.value;
            return { type: 'expressionAttribute', name: attribute.name, value };
        }
        return { type: 'attribute', name: attribute.name, value: attribute.value ?? null };
    });
};
