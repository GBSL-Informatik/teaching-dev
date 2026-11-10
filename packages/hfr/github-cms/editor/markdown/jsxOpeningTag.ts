import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import type { Node } from 'prosemirror-model';
import { type ContainerFormat, type JsxAttribute, schema } from '../schema';
import { toJsxAttributes } from './parse';
import { DEFAULT_JSX_FORMAT, jsxAttributes } from './serialize';
import { parseMdx } from './syntax';

export interface JsxOpeningTag {
    name: string;
    attributes: JsxAttribute[];
    /** the tag as typed, closed like the node: `<Name a="b">` or `<Name a="b" />` */
    source: string;
}

const isVoid = (node: Node) => node.type === schema.nodes.jsx_flow_void;

/**
 * The opening tag of a jsx node as written in the source, e.g. `<Foo bar="baz">`.
 */
export const jsxOpeningTagOf = (node: Node): string => {
    const { name, attributes, format } = node.attrs;
    if (format?.openingTag) {
        return format.openingTag;
    }
    const tag = `<${name}${jsxAttributes(attributes)}`;
    return isVoid(node) ? `${tag} />` : `${tag}>`;
};

/**
 * Parses an opening tag typed by the user, e.g. `<Foo bar="baz">`.
 * Throws when it is not valid jsx, e.g. when a quote or a brace is missing.
 */
export const parseJsxOpeningTag = (text: string, node: Node): JsxOpeningTag => {
    // without the closing `>` or `/>`, but with a line break before it
    const head = text
        .trim()
        .replace(/\/?>$/, '')
        .replace(/[ \t]+$/, '');
    const element = parseSingleElement(selfClosing(head));
    if (!element.name) {
        throw new Error('Der Name des Elements fehlt, z.B. <Name attribut="wert">.');
    }
    return {
        name: element.name,
        attributes: toJsxAttributes(element.attributes, 0),
        source: isVoid(node) ? selfClosing(head) : `${head}>`
    };
};

/**
 * The attrs of the jsx node with the new opening tag. The tag is kept as typed,
 * so its formatting (e.g. line breaks between the attributes) is saved.
 */
export const withJsxOpeningTag = (node: Node, tag: JsxOpeningTag) => {
    const format: ContainerFormat = node.attrs.format ?? DEFAULT_JSX_FORMAT;
    return {
        name: tag.name,
        attributes: tag.attributes,
        format: { ...format, openingTag: tag.source }
    };
};

const selfClosing = (head: string) => (head.endsWith('\n') ? `${head}/>` : `${head} />`);

const parseSingleElement = (source: string): MdxJsxFlowElement => {
    const [element, ...rest] = parseWithPosition(source).children;
    if (element?.type !== 'mdxJsxFlowElement' || rest.length > 0) {
        throw new Error('Erwartet wird genau ein Tag, z.B. <Name attribut="wert">.');
    }
    return element;
};

interface SyntaxError {
    reason: string;
    line: number;
    column: number;
}

/** the syntax errors of micromark are a `VFileMessage`, which knows where it occurred */
const isSyntaxError = (error: unknown): error is SyntaxError => {
    return error instanceof Error && 'line' in error && typeof error.line === 'number';
};

const parseWithPosition = (source: string) => {
    try {
        return parseMdx(source);
    } catch (error) {
        if (isSyntaxError(error)) {
            throw new Error(`Zeile ${error.line}, Spalte ${error.column}: ${error.reason}`);
        }
        throw error;
    }
};
