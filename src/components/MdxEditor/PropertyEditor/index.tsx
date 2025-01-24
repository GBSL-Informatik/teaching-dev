import React from 'react';
import _ from 'lodash';
import {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxExpressionAttribute
} from 'mdast-util-mdx-jsx';
import { JsxPropertyDescriptor, useMdastNodeUpdater } from '@mdxeditor/editor';

/* @see https://github.com/mdx-editor/editor/blob/main/src/plugins/core/PropertyPopover.tsx */
import Editor from './Editor';

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

export interface Props {
    properties: JsxPropertyDescriptor[];
    mdastAttributes: (MdxJsxAttribute | MdxJsxExpressionAttribute)[];
    title?: string;
    onClose?: () => void;
}

const PropertyEditor = (props: Props) => {
    const { properties, mdastAttributes } = props;
    const updateMdastNode = useMdastNodeUpdater();
    const cProps = React.useMemo(
        () =>
            properties.reduce<Record<string, string>>((acc, { name }) => {
                const attribute = mdastAttributes.find((attr) =>
                    isMdxJsxAttribute(attr) ? attr.name === name : false
                );

                if (attribute) {
                    if (isExpressionValue(attribute.value)) {
                        acc[name] = attribute.value.value;
                        return acc;
                    }

                    if (isStringValue(attribute.value)) {
                        acc[name] = attribute.value;
                        return acc;
                    }
                }

                acc[name] = '';
                return acc;
            }, {}),
        [mdastAttributes, properties]
    );
    const defValues = React.useMemo(() => {
        const defaults = properties.reduce<Record<string, string | number>>((acc, { name, type }) => {
            acc[name] = type === 'number' ? 0 : '';
            return acc;
        }, {});

        return defaults;
    }, [properties]);

    const onChange = React.useCallback(
        (values: Record<string, string>) => {
            const updatedAttributes = Object.entries(values).reduce<typeof mdastAttributes>(
                (acc, [name, value]) => {
                    if (value === '') {
                        return acc;
                    }

                    const property = properties.find((prop) => prop.name === name);

                    if (property?.type === 'expression') {
                        acc.push({
                            type: 'mdxJsxAttribute',
                            name,
                            value: { type: 'mdxJsxAttributeValueExpression', value }
                        });
                        return acc;
                    }

                    acc.push({
                        type: 'mdxJsxAttribute',
                        name,
                        value
                    });

                    return acc;
                },
                []
            );

            updateMdastNode({ attributes: updatedAttributes });
        },
        [mdastAttributes, updateMdastNode, properties]
    );
    if (properties.length === 0) {
        return null;
    }
    return <Editor onChange={onChange} properties={cProps} defaultValues={defValues} />;
};

export default PropertyEditor;
