import React from 'react';
import _ from 'lodash';
import { Directives } from 'mdast-util-directive';
import { useMdastNodeUpdater } from '@mdxeditor/editor';

import type { GenericPropery, GenericValueProperty } from '../GenericAttributeEditor';
import { Options, transformAttributes } from '@tdev-plugins/helpers';

export type DirectiveProperty = Omit<GenericPropery, 'type'> & { type: React.HTMLInputTypeAttribute };
type DirectiveValueProperty = Omit<GenericValueProperty, 'type'> & { type: React.HTMLInputTypeAttribute };

export const useDirectiveAttributeEditor = (
    properties: DirectiveProperty[],
    mdastAttributes: Directives['attributes'],
    jsxAttrTransformer?: (raw: Options) => Options
) => {
    const updateMdastNode = useMdastNodeUpdater();
    const { jsxAttributes, directiveAttributes } = React.useMemo(() => {
        const rawAttributes = transformAttributes(mdastAttributes || {});
        const jsxAttributes: Options = jsxAttrTransformer ? jsxAttrTransformer(rawAttributes) : rawAttributes;
        const directiveAttrs: Record<string, string> = {
            class: rawAttributes.className,
            ...rawAttributes.style,
            ...rawAttributes.attributes
        };
        delete (directiveAttrs as any).className;
        if (!directiveAttrs.class) {
            delete (directiveAttrs as any).class;
        }

        return { jsxAttributes: jsxAttributes, directiveAttributes: directiveAttrs };
    }, [mdastAttributes, properties, jsxAttrTransformer]);

    const onUpdate = React.useCallback(
        (values: DirectiveValueProperty[]) => {
            const updatedAttributes = values.reduce<typeof mdastAttributes>((acc, prop) => {
                if (!acc) {
                    return acc;
                }
                if (prop.value === '' || !prop.value) {
                    return acc;
                }
                // for directives, the attribute "className" is called "class"
                // --> like that, tha values will be correctly transformed to ".name"
                if (prop.name === 'className') {
                    acc.class = prop.value;
                } else {
                    if (prop.value === 'true') {
                        prop.value = '';
                    } else if (prop.value === 'false') {
                        return acc;
                    }
                    acc[prop.name] = prop.value;
                }
                return acc;
            }, {});
            const untouchedAttributes = mdastAttributes ? _.cloneDeep(mdastAttributes) : {};
            if (updatedAttributes) {
                Object.keys(untouchedAttributes).forEach((key) => {
                    if (key in updatedAttributes) {
                        delete untouchedAttributes[key];
                    }
                });
            }
            updateMdastNode({ attributes: { ...(updatedAttributes || {}), ...untouchedAttributes } });
        },
        [mdastAttributes, updateMdastNode, properties]
    );

    return { jsxAttributes: jsxAttributes, directiveAttributes: directiveAttributes, onUpdate: onUpdate };
};
