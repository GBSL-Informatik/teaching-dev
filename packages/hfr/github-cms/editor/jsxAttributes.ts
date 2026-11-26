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

/** e.g. `true` in `correct={true}`, `undefined` for other expressions */
export const booleanLiteral = (expression: string): boolean | undefined => {
    const text = expression.trim();
    return text === 'true' || text === 'false' ? text === 'true' : undefined;
};

const NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)$/;

/** e.g. `-0.5` in `minPoints={-0.5}`, `undefined` for other expressions */
export const numberLiteral = (expression: string): number | undefined => {
    const text = expression.trim();
    return NUMBER_PATTERN.test(text) ? Number(text) : undefined;
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
    return booleanLiteral(attribute.value) ?? null;
};

/** `undefined` when not written, `null` when not a number literal, e.g. `minPoints={min}` */
export const numberAttribute = (attributes: JsxAttribute[], name: string): number | undefined | null => {
    const attribute = findAttribute(attributes, name);
    if (!attribute) {
        return undefined;
    }
    return attribute.type === 'expressionAttribute' ? (numberLiteral(attribute.value) ?? null) : null;
};

/** an attribute written as expression, e.g. `correct={[1, 3]}` */
export const expressionAttribute = (name: string, value: string): JsxAttribute => ({
    type: 'expressionAttribute',
    name,
    value
});

/** a boolean attribute set to true, e.g. `multiple` */
export const flagAttribute = (name: string): JsxAttribute => ({ type: 'attribute', name, value: null });

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
