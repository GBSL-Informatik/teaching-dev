import React from 'react';
import _ from 'lodash';
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
    const cProps = React.useMemo(
        () =>
            properties.reduce<Record<string, string>>((acc, prop) => {
                const attribute = mdastAttributes.find((attr) =>
                    isMdxJsxAttribute(attr) ? attr.name === prop.name : false
                );

                if (attribute) {
                    if (isExpressionValue(attribute.value)) {
                        acc[prop.name] = attribute.value.value;
                    }

                    if (isStringValue(attribute.value)) {
                        acc[prop.name] = attribute.value;
                    }
                }

                return acc;
            }, {}),
        [mdastAttributes, properties]
    );

    const onUpdate = React.useCallback(
        (values: GenericValueProperty[]) => {
            const updatedAttributes = values.reduce<typeof mdastAttributes>((acc, prop) => {
                if (prop.value === '' || !prop.value) {
                    return acc;
                }
                if (prop.type === 'expression') {
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

            updateMdastNode({ attributes: updatedAttributes });
        },
        [mdastAttributes, updateMdastNode, properties]
    );

    return { values: cProps, onUpdate: onUpdate };
};
