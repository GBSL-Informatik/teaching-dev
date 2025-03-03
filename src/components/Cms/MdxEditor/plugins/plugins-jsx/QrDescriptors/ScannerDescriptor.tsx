import React from 'react';
import { JsxComponentDescriptor, JsxPropertyDescriptor } from '@mdxeditor/editor';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import styles from './styles.module.scss';
import GenericAttributeEditor, {
    GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';

import Card from '@tdev-components/shared/Card';
import { useAttributeEditorInNestedEditor } from '@tdev-components/Cms/MdxEditor/hooks/useAttributeEditorInNestedEditor';
import Scanner from '@tdev-components/shared/QR-Code/Scanner';

const ScannerProps: GenericPropery[] = [
    { name: 'redirect', type: 'checkbox', description: 'Soll ein gescannter Link direkt geöffnet werden?' },
    { name: 'inNewTab', type: 'checkbox', description: 'Links in einem neuen Tab öffnen?' },
    { name: 'hideOpenLinkButton', type: 'checkbox', description: 'Versteckt den Button zum Öffnen von Links' }
];

const ScannerDescriptor: JsxComponentDescriptor = {
    name: 'Scanner',
    source: '@tdev-components/shared/QR-Code/Scanner',
    defaultExport: true,
    kind: 'flow',
    hasChildren: false,
    props: ScannerProps as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        const { onUpdate, values } = useAttributeEditorInNestedEditor(ScannerProps, mdastNode.attributes);

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
                <Scanner {...values} />
            </Card>
        );
    }
};
export default ScannerDescriptor;
