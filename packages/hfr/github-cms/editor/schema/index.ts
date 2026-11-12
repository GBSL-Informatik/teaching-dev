import { type MarkSpec, type Node, type NodeSpec, Schema, type TagParseRule } from 'prosemirror-model';
import { tableNodes } from 'prosemirror-tables';

/**
 * The ProseMirror schema mirrors mdast closely, so that converting between both stays simple.
 * Nested components (directives, jsx) are regular nodes with block content: there are no
 * nested editors, the whole file is one document with a single selection and undo history.
 *
 * Whatever the editor can not represent is kept as `raw_block` / `raw_inline` holding the
 * original markdown, so that no content is ever lost.
 */

export type JsxAttribute =
    | { type: 'attribute'; name: string; value: string | null }
    | { type: 'expressionAttribute'; name: string; value: string }
    | { type: 'spread'; value: string };

export type DirectiveAttributes = Record<string, string>;

/**
 * Formatting details of the original source of a container node,
 * used to reproduce the original formatting when the container is serialized.
 */
export interface ContainerFormat {
    /** the opening jsx tag as written in the source, e.g. `<Foo\n  bar="baz"\n>` */
    openingTag?: string;
    /** the number of colons of a directive fence */
    fence?: number;
    /** the indentation of the children */
    childIndent: string;
    /** line breaks between the opening and the first child */
    leading: number;
    /** line breaks between the last child and the closing */
    trailing: number;
}

/** formatting of the original source of a `directive_item` */
export interface ItemFormat {
    /** whether the item started with `::br`, the first item can omit it */
    hasBreak: boolean;
    /** line breaks between `::br` and the first child */
    leading?: number;
}

/** the directives whose items are separated by `::br`, see `items_directive` */
export const ITEMS_DIRECTIVES = ['cards', 'flex'];

/**
 * ProseMirror copies and pastes through html, also within the editor. Nodes write their type and
 * attributes into the html, so that e.g. a pasted component is not reduced to its content.
 */
const clipboardAttrs = (node: Node) => ({
    'data-cms-node': node.type.name,
    'data-cms-attrs': JSON.stringify(node.attrs)
});

/** parses the html written with `clipboardAttrs` back into the node */
const clipboardRule = (name: string, tag: string, rule: Partial<TagParseRule> = {}): TagParseRule => ({
    ...rule,
    tag: `${tag}[data-cms-node="${name}"]`,
    // before the generic rules of other nodes, e.g. `pre` of code blocks
    priority: 60,
    getAttrs: (dom) => JSON.parse(dom.getAttribute('data-cms-attrs') || '{}')
});

const codeLikeNode = (spec: NodeSpec): NodeSpec => ({
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    ...spec
});

const nodes = {
    doc: { content: 'frontmatter? block+' },

    frontmatter: codeLikeNode({
        toDOM: () => ['pre', { class: 'cms-frontmatter' }, ['code', 0]]
    }),

    paragraph: {
        group: 'block',
        content: 'inline*',
        /**
         * keep soft line breaks (`\n`) when ProseMirror reads typed text back from the DOM,
         * otherwise they are collapsed to spaces (and e.g. definition lists break)
         */
        whitespace: 'pre',
        parseDOM: [{ tag: 'p' }],
        toDOM: () => ['p', 0]
    },

    heading: {
        group: 'block',
        content: 'inline*',
        attrs: { level: { default: 1, validate: 'number' } },
        defining: true,
        parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({ tag: `h${level}`, attrs: { level } })),
        toDOM: (node) => [`h${node.attrs.level}`, 0]
    },

    blockquote: {
        group: 'block',
        content: 'block+',
        defining: true,
        parseDOM: [{ tag: 'blockquote' }],
        toDOM: () => ['blockquote', 0]
    },

    bullet_list: {
        group: 'block',
        content: 'list_item+',
        attrs: { tight: { default: true }, bullet: { default: '-' } },
        parseDOM: [{ tag: 'ul' }],
        toDOM: (node) => ['ul', { 'data-tight': node.attrs.tight }, 0]
    },

    ordered_list: {
        group: 'block',
        content: 'list_item+',
        attrs: { tight: { default: true }, start: { default: 1 }, delimiter: { default: '.' } },
        parseDOM: [{ tag: 'ol', getAttrs: (dom) => ({ start: Number(dom.getAttribute('start') || 1) }) }],
        toDOM: (node) => ['ol', { start: node.attrs.start, 'data-tight': node.attrs.tight }, 0]
    },

    list_item: {
        content: 'block+',
        attrs: { checked: { default: null } },
        defining: true,
        parseDOM: [{ tag: 'li' }],
        toDOM: (node) => ['li', { 'data-checked': node.attrs.checked }, 0]
    },

    code_block: codeLikeNode({
        group: 'block',
        attrs: { lang: { default: '' }, meta: { default: '' } },
        parseDOM: [
            clipboardRule('code_block', 'pre', { preserveWhitespace: 'full' }),
            { tag: 'pre', preserveWhitespace: 'full' }
        ],
        toDOM: (node) => ['pre', clipboardAttrs(node), ['code', 0]]
    }),

    math_block: codeLikeNode({
        group: 'block',
        parseDOM: [clipboardRule('math_block', 'pre', { preserveWhitespace: 'full' })],
        toDOM: (node) => ['pre', { class: 'cms-math', ...clipboardAttrs(node) }, ['code', 0]]
    }),

    /** markdown the editor does not understand: esm imports, expressions, html, definitions... */
    raw_block: codeLikeNode({
        group: 'block',
        attrs: { kind: { default: 'unknown' } },
        parseDOM: [clipboardRule('raw_block', 'pre', { preserveWhitespace: 'full' })],
        toDOM: (node) => ['pre', { class: 'cms-raw', ...clipboardAttrs(node) }, ['code', 0]]
    }),

    thematic_break: {
        group: 'block',
        parseDOM: [{ tag: 'hr' }],
        toDOM: () => ['hr']
    },

    /** `:::name[label]{attributes}` */
    container_directive: {
        group: 'block',
        content: 'directive_label? block+',
        attrs: { name: { default: 'note' }, attributes: { default: {} }, format: { default: null } },
        isolating: true,
        /**
         * kept when its whole content is replaced, but not pasted together with content copied from
         * inside of it (as `defining: true` would)
         */
        definingAsContext: true,
        parseDOM: [clipboardRule('container_directive', 'div')],
        toDOM: (node) => ['div', { 'data-directive': node.attrs.name, ...clipboardAttrs(node) }, 0]
    },

    /**
     * `:::cards` and `:::flex`: their items are separated by `::br` in markdown,
     * here each item is a node, see `directive_item`.
     */
    items_directive: {
        group: 'block',
        content: 'directive_label? directive_item+',
        attrs: { name: { default: 'cards' }, attributes: { default: {} }, format: { default: null } },
        isolating: true,
        definingAsContext: true,
        parseDOM: [clipboardRule('items_directive', 'div')],
        toDOM: (node) => ['div', { 'data-directive': node.attrs.name, ...clipboardAttrs(node) }, 0]
    },

    /**
     * An item of `:::cards` or `:::flex`, it starts with `::br[label]{attributes}`.
     * The first item omits a `::br` without label and attributes.
     */
    directive_item: {
        content: 'block+',
        attrs: {
            label: { default: '' },
            attributes: { default: {} },
            format: { default: null }
        },
        definingAsContext: true,
        parseDOM: [clipboardRule('directive_item', 'div')],
        toDOM: (node) => ['div', { class: 'cms-directive-item', ...clipboardAttrs(node) }, 0]
    },

    directive_label: {
        content: 'inline*',
        definingAsContext: true,
        parseDOM: [clipboardRule('directive_label', 'div')],
        toDOM: (node) => ['div', { class: 'cms-directive-label', ...clipboardAttrs(node) }, 0]
    },

    /** `::name[label]{attributes}` */
    leaf_directive: {
        group: 'block',
        atom: true,
        attrs: { name: { default: '' }, label: { default: '' }, attributes: { default: {} } },
        parseDOM: [clipboardRule('leaf_directive', 'div')],
        toDOM: (node) => ['div', { 'data-directive': node.attrs.name, ...clipboardAttrs(node) }]
    },

    /** `<Name attr="value">...children</Name>` */
    jsx_flow: {
        group: 'block',
        content: 'block+',
        attrs: { name: { default: '' }, attributes: { default: [] }, format: { default: null } },
        isolating: true,
        definingAsContext: true,
        parseDOM: [clipboardRule('jsx_flow', 'div')],
        toDOM: (node) => ['div', { 'data-jsx': node.attrs.name, ...clipboardAttrs(node) }, 0]
    },

    /** `<Name attr="value" />` */
    jsx_flow_void: {
        group: 'block',
        atom: true,
        attrs: { name: { default: '' }, attributes: { default: [] }, format: { default: null } },
        parseDOM: [clipboardRule('jsx_flow_void', 'div')],
        toDOM: (node) => ['div', { 'data-jsx': node.attrs.name, ...clipboardAttrs(node) }]
    },

    footnote_definition: {
        group: 'block',
        content: 'block+',
        attrs: { label: { default: '' } },
        definingAsContext: true,
        toDOM: () => ['div', { class: 'cms-footnote-definition' }, 0]
    },

    ...tableNodes({
        tableGroup: 'block',
        cellContent: 'inline*',
        cellAttributes: {
            align: {
                default: null,
                getFromDOM: (dom) => dom.style.textAlign || null,
                setDOMAttr: (value, attrs) => {
                    if (value) {
                        attrs.style = `text-align: ${value}`;
                    }
                }
            }
        }
    }),

    text: { group: 'inline' },

    hard_break: {
        group: 'inline',
        inline: true,
        selectable: false,
        parseDOM: [{ tag: 'br' }],
        toDOM: () => ['br']
    },

    image: {
        group: 'inline',
        inline: true,
        atom: true,
        draggable: true,
        attrs: { src: { default: '' }, alt: { default: '' }, title: { default: null } },
        parseDOM: [
            {
                tag: 'img[src]',
                getAttrs: (dom) => ({
                    src: dom.getAttribute('src'),
                    alt: dom.getAttribute('alt') || '',
                    title: dom.getAttribute('title')
                })
            }
        ],
        toDOM: (node) => ['img', { src: node.attrs.src, alt: node.attrs.alt, title: node.attrs.title }]
    },

    math_inline: {
        group: 'inline',
        inline: true,
        atom: true,
        attrs: { value: { default: '' } },
        leafText: (node) => `$${node.attrs.value}$`,
        parseDOM: [clipboardRule('math_inline', 'span')],
        toDOM: (node) => ['span', { class: 'cms-math-inline', ...clipboardAttrs(node) }]
    },

    /** `:name[label]{attributes}`, e.g. `:mdi[robot]` */
    text_directive: {
        group: 'inline',
        inline: true,
        atom: true,
        attrs: { name: { default: '' }, label: { default: '' }, attributes: { default: {} } },
        parseDOM: [clipboardRule('text_directive', 'span')],
        toDOM: (node) => ['span', { 'data-directive': node.attrs.name, ...clipboardAttrs(node) }]
    },

    footnote_reference: {
        group: 'inline',
        inline: true,
        atom: true,
        attrs: { label: { default: '' } },
        toDOM: (node) => ['sup', `[${node.attrs.label}]`]
    },

    raw_inline: {
        group: 'inline',
        inline: true,
        atom: true,
        attrs: { value: { default: '' } },
        toDOM: (node) => ['code', { class: 'cms-raw' }, node.attrs.value]
    }
} satisfies Record<string, NodeSpec>;

/**
 * The order of the marks defines how they are nested when serialized: the first mark is the outermost.
 */
const marks = {
    link: {
        attrs: { href: { default: '' }, title: { default: null } },
        inclusive: false,
        parseDOM: [
            {
                tag: 'a[href]',
                getAttrs: (dom) => ({ href: dom.getAttribute('href'), title: dom.getAttribute('title') })
            }
        ],
        toDOM: (mark) => ['a', { href: mark.attrs.href, title: mark.attrs.title }, 0]
    },
    strong: {
        parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
        toDOM: () => ['strong', 0]
    },
    emphasis: {
        parseDOM: [{ tag: 'em' }, { tag: 'i' }],
        toDOM: () => ['em', 0]
    },
    delete: {
        parseDOM: [{ tag: 's' }, { tag: 'del' }],
        toDOM: () => ['s', 0]
    },
    box: {
        toDOM: () => ['strong', { class: 'boxed' }, 0]
    },
    kbd: {
        parseDOM: [{ tag: 'kbd' }],
        toDOM: () => ['kbd', 0]
    },
    /** inline code can be combined with other marks, e.g. *`emphasized code`* */
    code: {
        code: true,
        parseDOM: [{ tag: 'code' }],
        toDOM: () => ['code', 0]
    }
} satisfies Record<string, MarkSpec>;

export type NodeName = keyof typeof nodes;
export type MarkName = keyof typeof marks;

export const schema = new Schema<NodeName, MarkName>({ nodes, marks });
