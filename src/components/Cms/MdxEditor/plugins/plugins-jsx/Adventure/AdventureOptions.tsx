import { JsxComponentDescriptor, type JsxPropertyDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import { type GenericPropery } from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import RemoveNode from '../../../RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Card from '@tdev-components/shared/Card';
import { useAttributeEditorInNestedEditor } from '@tdev-components/Cms/MdxEditor/hooks/useAttributeEditorInNestedEditor';

const props: GenericPropery[] = [];

const AdventureOptions: JsxComponentDescriptor = {
    name: 'AdventureOptions',
    kind: 'flow',
    hasChildren: true,
    source: '@tdev-components/Adventure',
    defaultExport: false,
    props: props as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        return (
            <Card
                classNames={{ card: clsx(styles.options), header: clsx(styles.header) }}
                header={
                    <>
                        <h4>Antwortoptionen</h4>
                        <RemoveNode />
                    </>
                }
            >
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => {
                        return node.children;
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                />
            </Card>
        );
    }
};
export default AdventureOptions;
