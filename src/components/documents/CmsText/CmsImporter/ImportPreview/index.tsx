import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { type AssignedColumn } from '@tdev-components/shared/AssignColumns';

const getPreview = (table: string[][], selectedColumn: number, docRootId: string) => {
    const preview = table
        .flatMap((row) => {
            if ((row[selectedColumn] || '').trim().length === 0) {
                return null;
            }
            return {
                authorId: row[0],
                documentRootId: docRootId,
                data: {
                    text: row[selectedColumn]
                }
            };
        })
        .filter((x) => !!x);
    return JSON.stringify(preview, null, 2);
};

interface Props {
    tableWithHeader: string[][];
    assignments: AssignedColumn[];
}
const ImportPreview = (props: Props) => {
    const { assignments, tableWithHeader } = props;
    if (assignments.length < 1) {
        return null;
    }
    return (
        <>
            {assignments.length > 1 ? (
                <Tabs className={clsx(styles.tabs)}>
                    {assignments.map((assignment) => (
                        <TabItem
                            value={assignment.id}
                            label={assignment.name || assignment.id}
                            key={assignment.id}
                        >
                            <CodeBlock
                                language="json"
                                showLineNumbers
                                title="Vorschau"
                                className={clsx(styles.previewCode)}
                            >
                                {getPreview(tableWithHeader.slice(1), assignment.idx, assignment.id)}
                            </CodeBlock>
                        </TabItem>
                    ))}
                </Tabs>
            ) : (
                <CodeBlock
                    language="json"
                    showLineNumbers
                    title="Vorschau"
                    className={clsx(styles.previewCode)}
                >
                    {getPreview(tableWithHeader.slice(1), assignments[0].idx, assignments[0].id)}
                </CodeBlock>
            )}
        </>
    );
};

export default ImportPreview;
