import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { Math } from 'mdast-util-math';
import { BlockMath } from 'react-katex';
import { useMdastNodeUpdater } from '@mdxeditor/editor';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

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
