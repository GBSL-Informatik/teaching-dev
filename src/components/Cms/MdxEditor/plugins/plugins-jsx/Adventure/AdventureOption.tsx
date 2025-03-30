import { JsxComponentDescriptor, type JsxPropertyDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import BrowserWindow from '@tdev-components/BrowserWindow';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import GenericAttributeEditor, {
    type GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import RemoveNode from '../../../RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { useAttributeEditorInNestedEditor } from '../../../hooks/useAttributeEditorInNestedEditor';
import { parseExpression } from '../../../PropertyEditor/parseExpression';
import Card from '@tdev-components/shared/Card';
import MyAttributes from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor/MyAttributes';

const props: GenericPropery[] = [
    { name: 'label', type: 'text', required: true, placeholder: 'Option A' },
    {
        name: 'nextGuessIn',
        type: 'number',
        required: true,
        placeholder: '60',
        description: 'Zeit in [s] zwischen zwei Antworten.'
    }
];

const AdventureOption: JsxComponentDescriptor = {
    name: 'AdventureOption',
    kind: 'flow',
    hasChildren: true,
    source: '@tdev-components/Adventure',
    defaultExport: false,
    props: props as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        const { onUpdate, values, componentKey } = useAttributeEditorInNestedEditor(
            props,
            mdastNode.attributes
        );

        return (
            <Card
                classNames={{ card: styles.option, header: clsx(styles.header) }}
                header={
                    <>
                        <MyAttributes showValues attributes={values} />
                        <div className={clsx(styles.spacer)} />
                        <GenericAttributeEditor
                            properties={descriptor.props}
                            onUpdate={onUpdate}
                            values={values}
                        />
                        <RemoveNode />
                    </>
                }
            >
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => node.children}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                    block
                />
            </Card>
        );
    }
};
export default AdventureOption;
