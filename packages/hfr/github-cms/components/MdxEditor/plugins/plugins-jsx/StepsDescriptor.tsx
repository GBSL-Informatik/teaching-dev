import { JsxComponentDescriptor, type JsxPropertyDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import { type GenericPropery } from '../../../MdxEditor/GenericAttributeEditor';
import RemoveNode from '../../RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Steps from '@tdev-components/Steps';
import Card from '@tdev-components/shared/Card';

const props: GenericPropery[] = [];

const StepsDescriptor: JsxComponentDescriptor = {
    name: 'Steps',
    kind: 'flow',
    hasChildren: true,
    source: '@tdev-components/Steps',
    defaultExport: true,
    props: props as JsxPropertyDescriptor[],
    Editor: () => {
        return (
            <Card>
                <Steps inMdxEditor>
                    <div
                        className={clsx(styles.actions)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <h4>Steps</h4>
                        <RemoveNode />
                    </div>
                    <NestedLexicalEditor<MdxJsxFlowElement>
                        getContent={(node) => node.children}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        getUpdatedMdastNode={(mdastNode, children: any) => {
                            return { ...mdastNode, children };
                        }}
                    />
                </Steps>
            </Card>
        );
    }
};
export default StepsDescriptor;
