import type { JsxAttribute } from '../../../schema';

const hasName = (attribute: JsxAttribute, name: string) =>
    attribute.type !== 'spread' && attribute.name === name;

/** only plain string attributes can be shown, expressions are evaluated on the page */
export const stringAttribute = (attributes: JsxAttribute[], name: string) => {
    for (const attribute of attributes) {
        if (attribute.type === 'attribute' && attribute.name === name) {
            return attribute.value ?? undefined;
        }
    }
    return undefined;
};

/**
 * Sets a string attribute in place, or adds it at the end. An empty value removes it.
 */
const withStringAttribute = (attributes: JsxAttribute[], name: string, value: string): JsxAttribute[] => {
    if (!value) {
        return attributes.filter((attribute) => !hasName(attribute, name));
    }
    const updated: JsxAttribute = { type: 'attribute', name, value };
    if (!attributes.some((attribute) => hasName(attribute, name))) {
        return [...attributes, updated];
    }
    return attributes.map((attribute) => (hasName(attribute, name) ? updated : attribute));
};

/**
 * Sets the changed string attributes. Unchanged values are skipped, so an expression
 * (e.g. `url={...}`, shown as an empty field) is kept when it is not edited.
 * Returns the same array when nothing changed.
 */
export const withStringAttributes = (attributes: JsxAttribute[], values: Record<string, string>) => {
    return Object.entries(values).reduce((result, [name, value]) => {
        const isUnchanged = value === (stringAttribute(attributes, name) ?? '');
        return isUnchanged ? result : withStringAttribute(result, name, value);
    }, attributes);
};
