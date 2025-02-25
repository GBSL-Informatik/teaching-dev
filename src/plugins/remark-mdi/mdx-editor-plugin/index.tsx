/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { DirectiveDescriptor } from '@mdxeditor/editor';
import styles from './styles.module.scss';
import clsx from 'clsx';
import * as MdiIcons from '@mdi/js';
import Popup from 'reactjs-popup';
import Icon from '@mdi/react';
import { camelCased, captialize } from '@tdev/plugins/helpers';
import { transformMdiAttributes } from '@tdev/plugins/remark-mdi/plugin';
import { PopupActions } from 'reactjs-popup/dist/types';
import {
    DirectiveProperty,
    useDirectiveAttributeEditor
} from '@tdev-components/Cms/MdxEditor/hooks/useDirectiveAttributeEditor';
import PropertyEditor from '@tdev-components/Cms/MdxEditor/PropertyEditor';

export const DEFAULT_SIZE = '1.25em';

const props: DirectiveProperty[] = [
    {
        name: 'spin',
        type: 'string',
        placeholder: 'true',
        description: 'true = 2s, -2 counterclockwise, {spin}s',
        required: false
    },

    { name: 'size', type: 'string', description: '2, 1em, 48px', required: false, placeholder: DEFAULT_SIZE },
    {
        name: 'rotate',
        type: 'number',
        description: 'degrees 0 to 360',
        required: false,
        placeholder: 'undefined'
    },
    {
        name: 'color',
        type: 'string',
        description: 'rgb() / rgba() / #000',
        required: false,
        placeholder: 'undefined'
    },
    {
        name: 'className',
        type: 'string',
        description: 'additional class names',
        required: false,
        placeholder: 'undefined'
    },
    {
        name: 'title',
        type: 'string',
        description: 'A11y <title>{title}</title>',
        required: false,
        placeholder: 'undefined'
    },
    {
        name: 'horizontal',
        type: 'checkbox',
        description: 'Flip Horizontal',
        required: false,
        placeholder: 'undefined'
    },
    {
        name: 'vertical',
        type: 'checkbox',
        description: 'Flip Vertical',
        required: false,
        placeholder: 'undefined'
    }
];
/**
 * Pass this descriptor to the `directivesPlugin` `directiveDescriptors` parameter to enable {@link https://docusaurus.io/docs/markdown-features/admonitions | markdown admonitions}.
 *
 * @example
 * ```tsx
 * <MDXEditor
 *  plugins={[
 *   directivesPlugin({ directiveDescriptors: [ AdmonitionDirectiveDescriptor] }),
 *  ]} />
 * ```
 * @group Directive
 */
export const MdiDescriptor: DirectiveDescriptor = {
    name: 'mdi',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'mdi' && node.type === 'textDirective';
    },
    Editor({ mdastNode }) {
        const { jsxAttributes, directiveAttributes, onUpdate } = useDirectiveAttributeEditor(
            props,
            mdastNode.attributes,
            (raw) => {
                return transformMdiAttributes(raw, {
                    colorMapping: {
                        green: 'var(--ifm-color-success)',
                        red: 'var(--ifm-color-danger)',
                        orange: 'var(--ifm-color-warning)',
                        yellow: '#edcb5a',
                        blue: '#3578e5',
                        cyan: '#01f0bc'
                    },
                    defaultSize: DEFAULT_SIZE
                });
            }
        );
        const ref = React.useRef<PopupActions>(null);
        const icon = mdastNode.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
        const mdiIcon = `mdi${captialize(camelCased(icon))}`;
        return (
            <Popup
                trigger={
                    <span className={clsx(styles.mdiIcon)}>
                        <Icon
                            path={MdiIcons[mdiIcon as keyof typeof MdiIcons]}
                            size={1}
                            className={clsx(styles.icon, 'mdi-icon', jsxAttributes.className)}
                            {...jsxAttributes.jsxAttributes}
                            style={jsxAttributes.style}
                        />
                    </span>
                }
                keepTooltipInside="#__docusaurus"
                overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                ref={ref}
                modal
                on="click"
            >
                <PropertyEditor
                    values={{ ...directiveAttributes, className: directiveAttributes.class }}
                    onUpdate={onUpdate}
                    properties={props}
                    onClose={() => ref.current?.close()}
                />
            </Popup>
        );
    }
};
