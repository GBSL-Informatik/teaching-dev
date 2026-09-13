import { DirectiveDescriptor } from '@mdxeditor/editor';
import Loader from '@tdev-components/Loader';
import Card from '@tdev-components/shared/Card';
import PdfViewer from '@tdev/remark-pdf/PdfViewer';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import GenericAttributeEditor from '../../components/MdxEditor/GenericAttributeEditor';
import MyAttributes from '../../components/MdxEditor/GenericAttributeEditor/MyAttributes';
import RemoveNode from '../../components/MdxEditor/RemoveNode';
import { isRelPath, useAssetFile } from '../../components/MdxEditor/hooks/useAssetFile';
import {
    DirectiveProperty,
    useDirectiveAttributeEditor
} from '../../components/MdxEditor/hooks/useDirectiveAttributeEditor';
import styles from './styles.module.scss';

const props: DirectiveProperty[] = [
    {
        name: 'scroll',
        description: 'Seiten Scrollen, nicht blättern',
        type: 'checkbox',
        required: false
    },
    {
        name: 'page',
        description: 'Seite',
        type: 'number',
        required: false
    },
    {
        name: 'width',
        description: 'Breite',
        type: 'text',
        required: false
    },
    {
        name: 'minWidth',
        description: 'Mindestbreite',
        type: 'text',
        required: false
    },
    {
        name: 'noDownload',
        type: 'checkbox',
        description: 'Download verbergen',
        required: false
    },
    {
        name: 'scale',
        type: 'number',
        description: 'Skalierung',
        required: false
    }
];
export const PdfDescriptor: DirectiveDescriptor = {
    name: 'pdf',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'pdf' && node.type === 'leafDirective';
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
        const isRelAsset = React.useMemo(() => {
            return isRelPath(src);
        }, [src]);
        const gitPDf = useAssetFile(src, false);
        return (
            <Card>
                <div className={clsx(styles.actions)}>
                    <GenericAttributeEditor
                        values={{ ...directiveAttributes, className: directiveAttributes.class }}
                        onUpdate={onUpdate}
                        properties={props}
                        canExtend
                    />
                    <MyAttributes title={gitPDf?.name || src} attributes={directiveAttributes} />
                    <RemoveNode />
                </div>
                <div className={clsx(styles.media)}>
                    {isRelAsset && !gitPDf && <Loader label="PDF laden..." />}
                    {(isRelAsset ? gitPDf?.type === 'bin_file' : true) && (
                        <PdfViewer
                            file={
                                gitPDf?.type === 'bin_file'
                                    ? { data: new Uint8Array(gitPDf.binData) }
                                    : { url: src }
                            }
                            name={gitPDf?.name || src || ''}
                            scroll={jsxAttributes.attributes.scroll as boolean}
                            page={jsxAttributes.attributes.page as number}
                            width={jsxAttributes.attributes.width as number}
                            minWidth={jsxAttributes.attributes.minWidth as number}
                            scale={jsxAttributes.attributes.scale as number}
                            noDownload={jsxAttributes.attributes.noDownload as boolean}
                        />
                    )}
                </div>
            </Card>
        );
    })
};
