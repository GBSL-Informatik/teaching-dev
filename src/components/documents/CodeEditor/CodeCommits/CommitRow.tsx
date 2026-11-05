import type { CodeType } from '@tdev-api/document';
import { useComputed } from '@tdev-hooks/useComputed';
import { useStore } from '@tdev-hooks/useStore';
import type iCode from '@tdev-models/documents/iCode';
import type { CommitGraphNode } from '@tdev-models/documents/iCode';
import type { GraphRow } from '@tdev-models/helpers/commitGraph';
import { formatDateTime } from '@tdev-models/helpers/date';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import GraphCell from './GraphCell';
import PreviewButton from './PreviewButton';
import RestoreButton from './RestoreButton';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
    row: GraphRow<CommitGraphNode>;
    laneCount: number;
}

const CommitRow = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, row, laneCount } = props;
    const { codeCommitsView } = useStore('viewStore');
    const { id: nodeId, commit } = row.node;
    const isSelected = useComputed(
        () => codeCommitsView.isSelected(code, nodeId),
        [codeCommitsView, code, nodeId]
    );
    const isHead = useComputed(() => code.codeCommitId === (commit?.id ?? null), [code, commit]);
    const isModified = isHead && code.hasUncommittedChanges;

    const handleSelect = () => codeCommitsView.toggleSelection(code, nodeId);
    const handleRestore = React.useCallback(
        () => codeCommitsView.restore(code, commit),
        [codeCommitsView, code, commit]
    );

    const title = commit?.title ?? 'Ursprünglicher Code';

    return (
        <div className={clsx(styles.row, isHead && styles.head, isSelected && styles.selected)}>
            <GraphCell row={row} laneCount={laneCount} isHead={isHead} />
            <div className={styles.content}>
                <div className={styles.summary} onClick={handleSelect}>
                    {isHead && <span className={clsx('badge', 'badge--primary')}>HEAD</span>}
                    {isModified && <span className={clsx('badge', 'badge--warning')}>Geändert</span>}
                    <span className={styles.title}>{title}</span>
                    {commit && <span className={styles.date}>{formatDateTime(commit.createdAt, true)}</span>}
                    {isSelected && <RestoreButton code={code} isHead={isHead} onRestore={handleRestore} />}
                    <PreviewButton code={code} nodeId={nodeId} />
                </div>
                {isSelected && commit?.details && <div className={styles.details}>{commit.details}</div>}
            </div>
        </div>
    );
});

export default CommitRow;
