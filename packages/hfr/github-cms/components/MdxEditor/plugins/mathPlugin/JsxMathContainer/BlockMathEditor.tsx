import { useMdastNodeUpdater } from '@mdxeditor/editor';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import clsx from 'clsx';
import { Math } from 'mdast-util-math';
import { BlockMath } from 'react-katex';
import RemoveNode from '../../../../MdxEditor/RemoveNode';
import styles from './styles.module.scss';

interface Props {
    mdastNode: Math;
}

const BlockMathEditor = (props: Props) => {
    const { mdastNode } = props;
    const updateMdastNode = useMdastNodeUpdater();
    return (
        <div className={clsx(styles.container)}>
            <Tabs className={clsx(styles.tabs)}>
                <TabItem value="math" label="Math">
                    <BlockMath>{mdastNode.value}</BlockMath>
                </TabItem>
                <TabItem value="latex" label="Latex">
                    <CodeEditor
                        lang="tex"
                        defaultValue={mdastNode.value}
                        onChange={(value) => {
                            updateMdastNode({ value: value });
                        }}
                    />
                </TabItem>
            </Tabs>
            <RemoveNode className={clsx(styles.rmNode)} size={SIZE_S} />
        </div>
    );
};

export default BlockMathEditor;
