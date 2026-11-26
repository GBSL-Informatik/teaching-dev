import type { JsxAttribute } from './schema';

const hasName = (attribute: JsxAttribute, name: string) =>
    attribute.type !== 'spread' && attribute.name === name;

export const findAttribute = (attributes: JsxAttribute[], name: string) =>
    attributes.find((attribute) => hasName(attribute, name));

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
 * A boolean attribute, written as flag (`multiple`) or literal (`correct={false}`).
 * `undefined` when not written, `null` when not a boolean literal, e.g. `correct={isTrue}`.
 */
export const booleanAttribute = (attributes: JsxAttribute[], name: string): boolean | undefined | null => {
    const attribute = findAttribute(attributes, name);
    if (!attribute) {
        return undefined;
    }
    if (attribute.type === 'attribute') {
        return attribute.value === null ? true : null;
    }
    const value = attribute.value.trim();
    if (value === 'true' || value === 'false') {
        return value === 'true';
    }
    return null;
};

/**
 * Replaces the attribute with the same name in place, or adds it at the end.
 * `null` removes the attribute.
 */
export const withAttribute = (
    attributes: JsxAttribute[],
    name: string,
    updated: JsxAttribute | null
): JsxAttribute[] => {
    if (!updated) {
        return attributes.filter((attribute) => !hasName(attribute, name));
    }
    if (!findAttribute(attributes, name)) {
        return [...attributes, updated];
    }
    return attributes.map((attribute) => (hasName(attribute, name) ? updated : attribute));
};

/** Sets a string attribute. An empty value removes it. */
const withStringAttribute = (attributes: JsxAttribute[], name: string, value: string): JsxAttribute[] => {
    const updated: JsxAttribute | null = value ? { type: 'attribute', name, value } : null;
    return withAttribute(attributes, name, updated);
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
