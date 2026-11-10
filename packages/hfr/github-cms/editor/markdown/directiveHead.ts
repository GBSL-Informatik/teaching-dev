import type { Node } from 'prosemirror-model';
import { type DirectiveAttributes, ITEMS_DIRECTIVES, schema } from '../schema';
import { toDirectiveAttributes } from './parse';
import { directiveAttributes } from './serialize';
import { parseMdx } from './syntax';

/** the name and the attributes of a directive, e.g. `:::tip{#id}`, without the title */
export interface DirectiveHead {
    name: string;
    attributes: DirectiveAttributes;
}

const isLeaf = (node: Node) => node.type === schema.nodes.leaf_directive;

/**
 * The head of a container or leaf directive, e.g. `:::tip{#id}` or `::youtube{#id}`.
 */
export const directiveHeadOf = (node: Node): string => {
    const { name, attributes } = node.attrs;
    const fence = isLeaf(node) ? '::' : ':::';
    return `${fence}${name}${directiveAttributes(attributes)}`;
};

/**
 * Parses the head of a directive typed by the user, e.g. `:::tip{#id .red}`.
 * Throws when it is not valid, e.g. when a quote or a brace is missing.
 */
export const parseDirectiveHead = (text: string, node: Node): DirectiveHead => {
    const head = text.trim();
    const directive = isLeaf(node) ? parseLeafDirective(head) : parseContainerDirective(head);
    if (directive.children.length > 0) {
        throw new Error('Der Titel [...] wird nicht hier bearbeitet.');
    }
    const { name } = node.attrs;
    if (ITEMS_DIRECTIVES.includes(name) !== ITEMS_DIRECTIVES.includes(directive.name)) {
        throw new Error(`:::${name} kann nicht in :::${directive.name} umbenannt werden.`);
    }
    return { name: directive.name, attributes: toDirectiveAttributes(directive) };
};

/**
 * The only node of the source, `undefined` when there are several or it is not valid mdx.
 * With invalid attributes, the text is not recognized as a directive: it becomes a paragraph,
 * or an expression `{...}` that fails to parse. Both are reported by `invalidHead`.
 */
const parseFirstNode = (source: string) => {
    try {
        const [first, ...rest] = parseMdx(source).children;
        return rest.length > 0 ? undefined : first;
    } catch {
        return undefined;
    }
};

const invalidHead = (example: string) => {
    return new Error(`Erwartet wird z.B. ${example}. Fehlt ein Anführungszeichen oder eine Klammer?`);
};

const parseContainerDirective = (head: string) => {
    const fence = head.match(/^:*/)![0];
    const directive = parseFirstNode(`${head}\n${fence}`);
    if (directive?.type !== 'containerDirective') {
        throw invalidHead(':::name{#id .klasse attribut="wert"}');
    }
    return directive;
};

const parseLeafDirective = (head: string) => {
    const directive = parseFirstNode(head);
    if (directive?.type !== 'leafDirective') {
        throw invalidHead('::name{#id .klasse attribut="wert"}');
    }
    return directive;
};
