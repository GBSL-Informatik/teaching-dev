import React from 'react';
import _ from 'es-toolkit/compat';
import {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxExpressionAttribute
} from 'mdast-util-mdx-jsx';
import { useMdastNodeUpdater } from '@mdxeditor/editor';

import type { GenericPropery, GenericValueProperty } from '../GenericAttributeEditor';

// @see https://github.com/mdx-editor/editor/blob/main/src/jsx-editors/GenericJsxEditor.tsx

const isExpressionValue = (
    value: string | MdxJsxAttributeValueExpression | null | undefined
): value is MdxJsxAttributeValueExpression => {
    if (
        value !== null &&
        typeof value === 'object' &&
        'type' in value &&
        'value' in value &&
        typeof value.value === 'string'
    ) {
        return true;
    }

    return false;
};

const isStringValue = (value: string | MdxJsxAttributeValueExpression | null | undefined): value is string =>
    typeof value === 'string';

const isMdxJsxAttribute = (value: MdxJsxAttribute | MdxJsxExpressionAttribute): value is MdxJsxAttribute => {
    if (value.type === 'mdxJsxAttribute' && typeof value.name === 'string') {
        return true;
    }

    return false;
};

export const useAttributeEditorInNestedEditor = (
    properties: GenericPropery[],
    mdastAttributes: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
) => {
    const updateMdastNode = useMdastNodeUpdater();
    const [componentKey, setComponentKey] = React.useState<number>(Date.now());
    const cProps = React.useMemo(() => {
        const availableNames = [
            ...new Set<string>([
                ...mdastAttributes.filter((a) => a.type === 'mdxJsxAttribute').map((attr) => attr.name),
                ...properties.map((prop) => prop.name)
            ])
        ];

        return availableNames.reduce<Record<string, string>>((acc, name) => {
            const attribute = mdastAttributes.find((attr) =>
                isMdxJsxAttribute(attr) ? attr.name === name : false
            );

            if (attribute) {
                if (isExpressionValue(attribute.value)) {
                    acc[name] = attribute.value.value;
                }

                if (isStringValue(attribute.value)) {
                    acc[name] = attribute.value;
                }
            }

            return acc;
        }, {});
    }, [mdastAttributes, properties]);

    const onUpdate = React.useCallback(
        (values: GenericValueProperty[]) => {
            const updatedAttributes = values.reduce<typeof mdastAttributes>((acc, prop) => {
                if (prop.value === '' || !prop.value) {
                    return acc;
                }
                if (prop.type === 'expression' || prop.type === 'multi-select') {
                    acc.push({
                        type: 'mdxJsxAttribute',
                        name: prop.name,
                        value: { type: 'mdxJsxAttributeValueExpression', value: prop.value }
                    });
                    return acc;
                }

                acc.push({
                    type: 'mdxJsxAttribute',
                    name: prop.name,
                    value: prop.value
                });

                return acc;
            }, []);
            setComponentKey((prev) => (prev ? prev + 1 : 1));
            updateMdastNode({ attributes: updatedAttributes });
        },
        [mdastAttributes, updateMdastNode, properties]
    );

    return { values: cProps, onUpdate: onUpdate, componentKey: componentKey };
};
