import React from 'react';
import { JsxComponentDescriptor, JsxPropertyDescriptor } from '@mdxeditor/editor';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import styles from './styles.module.scss';
import GenericAttributeEditor, {
    GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';

import Card from '@tdev-components/shared/Card';
import { useAttributeEditorInNestedEditor } from '@tdev-components/Cms/MdxEditor/hooks/useAttributeEditorInNestedEditor';
import Generator from '@tdev-components/shared/QR-Code/Generator';
import { toJsxAttributes } from '@tdev-components/Cms/MdxEditor/PropertyEditor/toJsxAttributes';

const ScannerProps: GenericPropery[] = [
    { name: 'text', required: true, type: 'text', description: 'Text im QR Code' },
    { name: 'showText', type: 'checkbox', description: 'Zeigt den Text unter dem QR Code' },
    { name: 'isLink', type: 'checkbox', description: 'Der Text ist ein Link' },
    { name: 'withInput', type: 'checkbox', description: 'Zeigt ein Eingabefeld' }
];

const GeneratorDescriptor: JsxComponentDescriptor = {
    name: 'Generator',
    source: '@tdev-components/shared/QR-Code/Generator',
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
                <Generator {...jsxValues} text={values.text || 'Quercus Robur'} key={values.text} />
            </Card>
        );
    }
};
export default GeneratorDescriptor;
