import type { DirectiveAttributes, JsxAttribute } from '../../schema';
import type { AttributeRow } from './AttributesForm';

export const jsxAttributesToRows = (attributes: JsxAttribute[]): AttributeRow[] => {
    return attributes.flatMap((attribute): AttributeRow[] => {
        switch (attribute.type) {
            case 'spread':
                return [];
            case 'expressionAttribute':
                return [{ name: attribute.name, value: attribute.value, isExpression: true }];
            case 'attribute':
                return [{ name: attribute.name, value: attribute.value ?? '', isExpression: false }];
        }
    });
};

/**
 * Spread attributes (`{...props}`) can not be edited and are kept as they are.
 * An attribute without a value is written as boolean attribute, e.g. `<Foo bar />`.
 */
export const rowsToJsxAttributes = (rows: AttributeRow[], previous: JsxAttribute[]): JsxAttribute[] => {
    const spreads = previous.filter((attribute) => attribute.type === 'spread');
    const attributes = rows.map((row): JsxAttribute => {
        if (row.isExpression) {
            return { type: 'expressionAttribute', name: row.name, value: row.value };
        }
        return { type: 'attribute', name: row.name, value: row.value === '' ? null : row.value };
    });
    return [...attributes, ...spreads];
};

export const directiveAttributesToRows = (attributes: DirectiveAttributes): AttributeRow[] => {
    return Object.entries(attributes).map(([name, value]) => ({ name, value, isExpression: false }));
};

export const rowsToDirectiveAttributes = (rows: AttributeRow[]): DirectiveAttributes => {
    return Object.fromEntries(rows.map((row) => [row.name, row.value]));
};
