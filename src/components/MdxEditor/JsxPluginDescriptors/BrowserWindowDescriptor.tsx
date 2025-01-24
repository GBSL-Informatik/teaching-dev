import { JsxComponentDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import BrowserWindow from '@tdev-components/BrowserWindow';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import GenericAttributeEditor from '../GenericAttributeEditor';
import RemoveJsxNode from '../RemoveJsxNode';
import styles from './styles.module.scss';
import clsx from 'clsx';

const BrowserWindowDescriptor: JsxComponentDescriptor = {
    name: 'BrowserWindow',
    kind: 'flow',
    hasChildren: true,
    source: '@tdev-components/BrowserWindow',
    defaultExport: true,
    props: [
        { name: 'url', type: 'string', required: false },
        { name: 'minHeight', type: 'number', required: false },
        { name: 'maxHeight', type: 'number', required: false }
    ],
    Editor: ({ descriptor, mdastNode }) => {
        const url = mdastNode.attributes.find(
            (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'url'
        );
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
                    <GenericAttributeEditor descriptor={descriptor} mdastNode={mdastNode} />
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
