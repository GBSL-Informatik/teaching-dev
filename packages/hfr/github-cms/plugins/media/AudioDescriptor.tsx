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

const props: DirectiveProperty[] = [];
export const AudioDescriptor: DirectiveDescriptor = {
    name: LeafDirectiveName.AUDIO,
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === LeafDirectiveName.AUDIO && node.type === 'leafDirective';
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
        const gitAudio = useAssetFile(src);

        return (
            <Card>
                <div className={clsx(styles.actions)}>
                    <GenericAttributeEditor
                        values={{ ...directiveAttributes, className: directiveAttributes.class }}
                        onUpdate={onUpdate}
                        properties={props}
                        canExtend
                    />
                    <MyAttributes title={gitAudio?.name || src} attributes={directiveAttributes} />
                    <RemoveNode />
                </div>
                <div className={clsx(styles.media)}>
                    <audio
                        key={gitAudio?.type === 'bin_file' ? gitAudio?.sha : src}
                        className={clsx(styles.video)}
                        style={{ maxWidth: '100%', ...jsxAttributes.style }}
                        controls
                        {...jsxAttributes.jsxAttributes}
                    >
                        <source src={gitAudio?.type === 'bin_file' ? gitAudio.src : src} />
                    </audio>
                </div>
            </Card>
        );
    })
};
