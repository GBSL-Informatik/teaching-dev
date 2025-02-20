import {
    JsxComponentDescriptor,
    type JsxPropertyDescriptor,
    NestedLexicalEditor,
    useMdastNodeUpdater
} from '@mdxeditor/editor';
import BrowserWindow from '@tdev-components/BrowserWindow';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import GenericAttributeEditor, {
    type GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import RemoveJsxNode from '../../RemoveJsxNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { useAttributeEditorInNestedEditor } from '../../PropertyEditor/useAttributeEditorInNestedEditor';

const props: GenericPropery[] = [
    { name: 'url', type: 'string', required: false, placeholder: 'http://localhost:3000' },
    { name: 'minHeight', type: 'string', required: false, placeholder: 'undefined' },
    { name: 'maxHeight', type: 'string', required: false, placeholder: 'undefined' },
    { name: 'className', type: 'string', required: false, placeholder: 'undefined' },
    {
        name: 'style',
        type: 'expression',
        required: false,
        placeholder: "z.B. { overflowX: 'auto' }",
        description: 'JSX Objekt-Syntax',
        lang: 'css'
    },
    {
        name: 'bodyStyle',
        type: 'expression',
        required: false,
        placeholder: "z.B. { background: 'red' }",
        description: 'JSX Objekt-Syntax',
        lang: 'css'
    }
];

const BrowserWindowDescriptor: JsxComponentDescriptor = {
    name: 'BrowserWindow',
    kind: 'flow',
    hasChildren: true,
    source: '@tdev-components/BrowserWindow',
    defaultExport: true,
    props: props as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        const url = mdastNode.attributes.find(
            (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'url'
        );
        const { onUpdate, values } = useAttributeEditorInNestedEditor(props, mdastNode.attributes);
        return (
            <BrowserWindow url={url?.value as string} className={clsx(styles.browserWindow)}>
                <div
                    className={clsx(styles.actions)}
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center'
                    }}
                >
                    <GenericAttributeEditor
                        properties={descriptor.props}
                        onUpdate={onUpdate}
                        values={values}
                    />
                    <RemoveJsxNode />
                </div>
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => node.children}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                />
            </BrowserWindow>
        );
    }
};
export default BrowserWindowDescriptor;
