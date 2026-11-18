import { XMLParser } from 'fast-xml-parser';

export interface XmlElement {
    tag: string;
    attrs: { [name: string]: string };
    children: XmlNode[];
}

export type XmlNode = XmlElement | string;

type OrderedNode = { [tag: string]: OrderedNode[] | string } & { ':@'?: { [name: string]: string } };

const TEXT_KEY = '#text';
const ATTRS_KEY = ':@';

// Element order matters in OOXML (runs, field characters), hence `preserveOrder`.
const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    ignoreDeclaration: true,
    ignorePiTags: true
});

export const parseXml = (xml: string): XmlElement => {
    const nodes = parser.parse(xml) as OrderedNode[];
    const root = nodes.map(toXmlNode).find(isElement);
    if (!root) {
        throw new Error('XML document has no root element');
    }
    return root;
};

const toXmlNode = (node: OrderedNode): XmlNode => {
    if (TEXT_KEY in node) {
        return String(node[TEXT_KEY]);
    }
    const tag = Object.keys(node).find((key) => key !== ATTRS_KEY)!;
    const children = node[tag] as OrderedNode[];
    return {
        tag,
        attrs: node[ATTRS_KEY] ?? {},
        children: children.map(toXmlNode)
    };
};

export const isElement = (node: XmlNode | undefined): node is XmlElement => {
    return typeof node === 'object';
};

export const childElements = (element: XmlElement, tag?: string): XmlElement[] => {
    return element.children.filter(
        (child): child is XmlElement => isElement(child) && (!tag || child.tag === tag)
    );
};

export const childElement = (element: XmlElement | undefined, tag: string): XmlElement | undefined => {
    return element?.children.find((child): child is XmlElement => isElement(child) && child.tag === tag);
};

export const attr = (element: XmlElement | undefined, name: string): string | undefined => {
    return element?.attrs[name];
};

/** Value of the `w:val` attribute of the child element `tag`. */
export const childVal = (element: XmlElement | undefined, tag: string): string | undefined => {
    return attr(childElement(element, tag), 'w:val');
};

/** All descendants with the tag, without looking into elements tagged `stopAt`. */
export const descendants = (element: XmlElement, tag: string, stopAt?: string): XmlElement[] => {
    const found: XmlElement[] = [];
    for (const child of childElements(element)) {
        if (child.tag === stopAt) {
            continue;
        }
        if (child.tag === tag) {
            found.push(child);
        }
        found.push(...descendants(child, tag, stopAt));
    }
    return found;
};

export const textContent = (element: XmlElement): string => {
    return element.children.map((child) => (isElement(child) ? textContent(child) : child)).join('');
};
