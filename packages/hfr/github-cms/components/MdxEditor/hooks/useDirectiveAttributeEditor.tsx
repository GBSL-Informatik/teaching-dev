import React from 'react';
import _ from 'es-toolkit/compat';
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
            const untouchedAttributes = mdastAttributes ? _.cloneDeep(mdastAttributes) : {};
            const updatedAttributes = values.reduce<typeof mdastAttributes>((acc, prop) => {
                if (!acc) {
                    return acc;
                }
                // for directives, the attribute "className" is called "class"
                // --> like that, tha values will be correctly transformed to ".name"
                const name = prop.name === 'className' ? 'class' : prop.name;
                if (name in untouchedAttributes) {
                    delete untouchedAttributes[name];
                }
                if (prop.value === '' || !prop.value) {
                    return acc;
                }
                if (prop.value === 'true') {
                    prop.value = '';
                } else if (prop.value === 'false') {
                    return acc;
                }
                acc[name] = prop.value;
                return acc;
            }, {});
            updateMdastNode({ attributes: { ...(updatedAttributes || {}), ...untouchedAttributes } });
        },
        [mdastAttributes, updateMdastNode, properties]
    );

    return { jsxAttributes: jsxAttributes, directiveAttributes: directiveAttributes, onUpdate: onUpdate };
};
