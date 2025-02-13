import React from 'react';
import _ from 'lodash';
import {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxExpressionAttribute
} from 'mdast-util-mdx-jsx';
import { JsxComponentDescriptor, MdastJsx, PropertyPopover, useMdastNodeUpdater } from '@mdxeditor/editor';
import PropertyEditor from './PropertyEditor';
import Popup from 'reactjs-popup';
import Icon from '@mdi/react';
import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';

export interface Props {
    descriptor: JsxComponentDescriptor;
    mdastNode: MdastJsx;
}

// @see https://github.com/mdx-editor/editor/blob/d484a0b7c06912527c03d3a2e8d56a69e70fef27/src/jsx-editors/GenericJsxEditor.tsx

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

const GenericAttributeEditor = (props: Props) => {
    const { descriptor, mdastNode } = props;
    const updateMdastNode = useMdastNodeUpdater();
    const properties = React.useMemo(
        () =>
            descriptor.props.reduce<Record<string, string>>((acc, { name }) => {
                const attribute = mdastNode.attributes.find((attr) =>
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
        [mdastNode, descriptor]
    );

    const onChange = React.useCallback(
        (values: Record<string, string>) => {
            const updatedAttributes = Object.entries(values).reduce<typeof mdastNode.attributes>(
                (acc, [name, value]) => {
                    if (value === '') {
                        return acc;
                    }

                    const property = descriptor.props.find((prop) => prop.name === name);

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
        [mdastNode, updateMdastNode, descriptor]
    );
    if (Object.keys(properties).length === 0) {
        return null;
    }
    // return <Popup
    //     trigger={
    //         <span >
    //             <Button
    //                 icon={mdiCog}
    //                 size={0.8}
    //             />
    //         </span>
    //     }
    //     keepTooltipInside="#__docusaurus"
    //     overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
    //     ref={ref}
    //     modal
    //     on="click"
    // >
    //     <PropertyEditor

    //     />
    // </Popup>
    return <PropertyPopover properties={properties} title={mdastNode.name ?? ''} onChange={onChange} />;
};

export default GenericAttributeEditor;
