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
        name: 'height',
        type: 'string',
        description: 'Höhe',
        placeholder: '100%',
        required: false
    },
    {
        name: 'minWidth',
        type: 'string',
        description: 'Breite (default: natürliche Video-Breite)',
        placeholder: '100%',
        required: false
    }
];
export const CircuitDescriptor: DirectiveDescriptor = {
    name: LeafDirectiveName.CIRCUITVERSE,
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === LeafDirectiveName.CIRCUITVERSE && node.type === 'leafDirective';
    },
    Editor: observer(({ mdastNode }) => {
        const { jsxAttributes, directiveAttributes, onUpdate } = useDirectiveAttributeEditor(
            props,
            mdastNode.attributes
        );
        const src = React.useMemo(() => {
            const firstChild = mdastNode.children[0];
            return firstChild.type === 'text'
                ? firstChild.value
                : firstChild.type === 'link'
                  ? firstChild.url
                  : '';
        }, [mdastNode]);

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
                        height={`${jsxAttributes.style?.height || '315px'}`}
                        {...jsxAttributes.jsxAttributes}
                        allow="fullscreen"
                        style={{
                            width: jsxAttributes.style?.minWidth
                                ? (jsxAttributes.style?.minWidth as string)
                                : '100%',
                            maxWidth: '100%',
                            ...jsxAttributes.style
                        }}
                    />
                </div>
            </Card>
        );
    })
};
