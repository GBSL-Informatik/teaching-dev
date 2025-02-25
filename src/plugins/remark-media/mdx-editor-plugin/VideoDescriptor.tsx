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
import { useAssetFile } from '@tdev-components/Cms/MdxEditor/hooks/useAssetFile';
import MyAttributes from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor/MyAttributes';
import { LeafDirectiveName } from '../plugin';

const props: DirectiveProperty[] = [
    {
        name: 'autoplay',
        type: 'checkbox',
        description: 'Automatisch abspielen',
        required: false
    },
    {
        name: 'muted',
        type: 'checkbox',
        description: 'Ohne Ton',
        required: false
    },
    {
        name: 'loop',
        type: 'checkbox',
        description: 'Endlosschleife',
        required: false
    },
    {
        name: 'controls',
        type: 'checkbox',
        description: 'Steuerung anzeigen',
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
        name: 'width',
        type: 'string',
        description: 'Breite (default: natürliche Video-Breite)',
        placeholder: '100%',
        required: false
    }
];
export const VideoDescriptor: DirectiveDescriptor = {
    name: LeafDirectiveName.VIDEO,
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === LeafDirectiveName.VIDEO && node.type === 'leafDirective';
    },
    Editor: observer(({ mdastNode }) => {
        const { jsxAttributes, directiveAttributes, onUpdate } = useDirectiveAttributeEditor(
            props,
            mdastNode.attributes,
            (raw) => {
                if (raw.jsxAttributes.autoplay !== undefined) {
                    raw.jsxAttributes.autoPlay = raw.jsxAttributes.autoplay;
                    delete raw.jsxAttributes.autoplay;
                }
                return raw;
            }
        );
        const src = React.useMemo(() => {
            const firstChild = mdastNode.children[0];
            return firstChild.type === 'text'
                ? firstChild.value
                : firstChild.type === 'link'
                  ? firstChild.url
                  : '';
        }, [mdastNode]);
        const gitVideo = useAssetFile(src);

        return (
            <Card>
                <div className={clsx(styles.actions)}>
                    <GenericAttributeEditor
                        values={{ ...directiveAttributes, className: directiveAttributes.class }}
                        onUpdate={onUpdate}
                        properties={props}
                        canExtend
                    />
                    <MyAttributes title={gitVideo?.name || src} attributes={directiveAttributes} />
                    <RemoveNode />
                </div>
                <div className={clsx(styles.media)}>
                    <video
                        className={clsx(styles.video)}
                        style={{ maxWidth: '100%', ...jsxAttributes.style }}
                        controls
                        {...jsxAttributes.jsxAttributes}
                    >
                        <source
                            key={gitVideo?.type === 'bin_file' ? gitVideo?.sha : src}
                            src={gitVideo?.type === 'bin_file' ? gitVideo.src : src}
                        />
                    </video>
                </div>
            </Card>
        );
    })
};
