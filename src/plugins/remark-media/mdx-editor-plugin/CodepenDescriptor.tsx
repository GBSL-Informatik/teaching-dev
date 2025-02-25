import React from 'react';
import { DirectiveDescriptor } from '@mdxeditor/editor';
import styles from './styles.module.scss';
import clsx from 'clsx';
import {
    DirectiveProperty,
    useDirectiveAttributeEditor
} from '@tdev-components/Cms/MdxEditor/hooks/useDirectiveAttributeEditor';
import { observer } from 'mobx-react-lite';
import Card from '@tdev-components/shared/Card';
import GenericAttributeEditor from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import MyAttributes from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor/MyAttributes';
import { LeafDirectiveName } from '../plugin';

const props: DirectiveProperty[] = [
    {
        name: 'editable',
        type: 'checkbox',
        description: 'Bearbeitbar?',
        required: false
    },
    {
        name: 'theme',
        type: 'string',
        description: 'light, dark',
        placeholder: 'light oder dark',
        required: false
    },
    {
        name: 'defaultTab',
        type: 'string',
        description: 'html,result',
        placeholder: 'html,js,css,result',
        required: false
    },
    {
        name: 'height',
        type: 'string',
        description: 'Höhe',
        placeholder: '100%',
        required: false
    },
    {
        name: 'minWidth',
        type: 'string',
        description: 'Breite',
        placeholder: '100%',
        required: false
    }
];
export const CodepenDescriptor: DirectiveDescriptor = {
    name: LeafDirectiveName.CODEPEN,
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === LeafDirectiveName.CODEPEN && node.type === 'leafDirective';
    },
    Editor: observer(({ mdastNode }) => {
        const { jsxAttributes, directiveAttributes, onUpdate } = useDirectiveAttributeEditor(
            props,
            mdastNode.attributes
        );
        const src = React.useMemo(() => {
            const firstChild = mdastNode.children[0];
            const val =
                firstChild.type === 'text'
                    ? firstChild.value
                    : firstChild.type === 'link'
                      ? firstChild.url
                      : '';
            let pen = val;
            if (/codepen\.io\/.*\/pen\/.*/.test(val)) {
                pen = val.replace(/\/pen\//, '/embed/');
            }

            const penSource = new URL(pen);
            penSource.searchParams.set('editable', 'true');
            if (directiveAttributes.theme) {
                penSource.searchParams.set('theme-id', `${directiveAttributes.theme}`);
            }
            if (directiveAttributes.defaultTab) {
                penSource.searchParams.set('default-tab', `${directiveAttributes.defaultTab}`);
            }
            if (directiveAttributes.editable !== undefined && !directiveAttributes.editable) {
                penSource.searchParams.delete('editable');
            }
            return penSource.toString();
        }, [mdastNode, directiveAttributes]);
        return (
            <Card>
                <div className={clsx(styles.actions)}>
                    <GenericAttributeEditor
                        values={{ ...directiveAttributes, className: directiveAttributes.class }}
                        onUpdate={onUpdate}
                        properties={props}
                        canExtend
                    />
                    <MyAttributes title={src} attributes={directiveAttributes} />
                    <RemoveNode />
                </div>
                <div className={clsx(styles.media)}>
                    <iframe
                        src={src}
                        width={`${jsxAttributes.style?.minWidth || '100%'}`}
                        height={`${jsxAttributes.style?.height || '500px'}`}
                        title="Codepen"
                        loading="lazy"
                        allow="fullscreen"
                        style={{
                            width: jsxAttributes.style?.minWidth
                                ? (jsxAttributes.style?.minWidth as string)
                                : '100%',
                            ...jsxAttributes.style
                        }}
                    />
                </div>
            </Card>
        );
    })
};
