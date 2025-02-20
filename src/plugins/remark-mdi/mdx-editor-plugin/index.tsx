/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { DirectiveDescriptor, useLexicalNodeRemove, useMdastNodeUpdater } from '@mdxeditor/editor';
import styles from './styles.module.scss';
import clsx from 'clsx';
import * as MdiIcons from '@mdi/js';
import Popup from 'reactjs-popup';
import Icon from '@mdi/react';
import { camelCased, captialize } from '@tdev/plugins/helpers';
import { transformMdiAttributes } from '@tdev/plugins/remark-mdi/plugin';
import Editor from '@tdev-components/Cms/MdxEditor/PropertyEditor/Editor';
import { PopupActions } from 'reactjs-popup/dist/types';
import Card from '@tdev-components/shared/Card';

export const DEFAULT_SIZE = '1.25em';
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
    Editor({ mdastNode, lexicalNode }) {
        const updater = useMdastNodeUpdater();
        const remover = useLexicalNodeRemove();
        const ref = React.useRef<PopupActions>(null);
        const attributes = transformMdiAttributes(mdastNode.attributes, {
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
        const icon = mdastNode.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
        const mdiIcon = `mdi${captialize(camelCased(icon))}`;
        return (
            <Popup
                trigger={
                    <span className={clsx(styles.mdiIcon)}>
                        <Icon
                            path={MdiIcons[mdiIcon as keyof typeof MdiIcons]}
                            size={1}
                            className={clsx(styles.icon, 'mdi-icon', attributes.className)}
                            {...attributes.attributes}
                            style={attributes.style}
                        />
                    </span>
                }
                keepTooltipInside="#__docusaurus"
                overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                ref={ref}
                modal
                on="click"
            >
                <Card>
                    <Editor
                        properties={mdastNode.attributes || {}}
                        defaultValues={{
                            spin: 0,
                            size: DEFAULT_SIZE,
                            rotate: 0,
                            color: '#000000',
                            className: '',
                            title: '',
                            horizontal: false,
                            vertical: false
                        }}
                        meta={{
                            spin: { type: 'string', description: 'true = 2s, -2 counterclockwise, {spin}s' },
                            size: { type: 'string', description: '2, 1em, 48px' },
                            rotate: { type: 'number', description: 'degrees 0 to 360' },
                            color: { type: 'color', description: 'rgb() / rgba() / #000' },
                            className: { type: 'string', description: 'additional class names' },
                            title: { type: 'string', description: 'A11y <title>{title}</title>' },
                            horizontal: { type: 'checkbox', description: 'Flip Horizontal' },
                            vertical: { type: 'checkbox', description: 'Flip Vertical' }
                        }}
                        onChange={(data) => {
                            updater({ attributes: data });
                        }}
                        onClose={() => {
                            ref.current?.close();
                        }}
                        onRemove={() => {
                            remover();
                        }}
                    />
                    {/* <DropdownSelector /> */}
                </Card>
            </Popup>
        );
    }
};
