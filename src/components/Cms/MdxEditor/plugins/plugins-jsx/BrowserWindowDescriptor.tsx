import { JsxComponentDescriptor, type JsxPropertyDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import BrowserWindow from '@tdev-components/BrowserWindow';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import GenericAttributeEditor, {
    type GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import RemoveNode from '../../RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { useAttributeEditorInNestedEditor } from '../../hooks/useAttributeEditorInNestedEditor';
import { parseExpression } from '../../PropertyEditor/parseExpression';

const props: GenericPropery[] = [
    { name: 'url', type: 'text', required: false, placeholder: 'http://localhost:3000' },
    { name: 'minHeight', type: 'text', required: false, placeholder: 'undefined' },
    { name: 'maxHeight', type: 'text', required: false, placeholder: 'undefined' },
    { name: 'className', type: 'text', required: false, placeholder: 'undefined' },
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
        const compStyle = parseExpression<React.CSSProperties>(values.style);
        const bodyStyle = parseExpression<React.CSSProperties>(values.bodyStyle);

        return (
            <BrowserWindow
                url={url?.value as string}
                className={clsx(styles.browserWindow)}
                style={compStyle}
                bodyStyle={bodyStyle}
            >
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
                        canExtend
                    />
                    <RemoveNode />
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
