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
