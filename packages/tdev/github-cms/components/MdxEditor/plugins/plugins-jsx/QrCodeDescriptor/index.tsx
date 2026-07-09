import React from 'react';
import { JsxComponentDescriptor, JsxPropertyDescriptor } from '@mdxeditor/editor';
import RemoveNode from '@tdev/github-cms/components/MdxEditor/RemoveNode';
import styles from './styles.module.scss';
import GenericAttributeEditor, {
    GenericPropery
} from '@tdev/github-cms/components/MdxEditor/GenericAttributeEditor';

import Card from '@tdev-components/shared/Card';
import { useAttributeEditorInNestedEditor } from '@tdev/github-cms/components/MdxEditor/hooks/useAttributeEditorInNestedEditor';
import QrCode from '@tdev-components/shared/QrCode';
import { toJsxAttributes } from '@tdev/github-cms/components/MdxEditor/PropertyEditor/toJsxAttributes';

const ScannerProps: GenericPropery[] = [
    { name: 'text', required: true, type: 'text', description: 'Text im QR Code' },
    { name: 'showText', type: 'checkbox', description: 'Zeigt den Text unter dem QR Code' },
    { name: 'isLink', type: 'checkbox', description: 'Der Text ist ein Link' },
    { name: 'withInput', type: 'checkbox', description: 'Zeigt ein Eingabefeld' }
];

const QrCodeDescriptor: JsxComponentDescriptor = {
    name: 'QrCode',
    source: '@tdev-components/shared/QrCode',
    defaultExport: true,
    kind: 'flow',
    hasChildren: false,
    props: ScannerProps as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        const { onUpdate, values } = useAttributeEditorInNestedEditor(ScannerProps, mdastNode.attributes);
        const jsxValues = toJsxAttributes(values);
        return (
            <Card
                classNames={{ header: styles.actions, body: styles.cardBody }}
                header={
                    <>
                        <GenericAttributeEditor
                            properties={ScannerProps}
                            onUpdate={onUpdate}
                            values={values}
                            canExtend
                        />
                        <RemoveNode />
                    </>
                }
            >
                <QrCode {...jsxValues} text={values.text || 'Quercus Robur'} key={values.text} />
            </Card>
        );
    }
};
export default QrCodeDescriptor;
