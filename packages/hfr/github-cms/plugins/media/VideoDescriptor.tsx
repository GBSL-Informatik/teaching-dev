import { DirectiveDescriptor } from '@mdxeditor/editor';
import Card from '@tdev-components/shared/Card';
import { LeafDirectiveName } from '@tdev-plugins/remark-media/plugin';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import GenericAttributeEditor from '../../components/MdxEditor/GenericAttributeEditor';
import MyAttributes from '../../components/MdxEditor/GenericAttributeEditor/MyAttributes';
import RemoveNode from '../../components/MdxEditor/RemoveNode';
import { useAssetFile } from '../../components/MdxEditor/hooks/useAssetFile';
import {
    DirectiveProperty,
    useDirectiveAttributeEditor
} from '../../components/MdxEditor/hooks/useDirectiveAttributeEditor';
import styles from './styles.module.scss';

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
        type: 'text',
        description: 'Höhe',
        placeholder: '100%',
        required: false
    },
    {
        name: 'width',
        type: 'text',
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
