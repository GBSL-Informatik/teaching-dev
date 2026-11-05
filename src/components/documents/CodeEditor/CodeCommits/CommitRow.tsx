import Translate, { translate } from '@docusaurus/Translate';
import type { CodeType } from '@tdev-api/document';
import { useComputed } from '@tdev-hooks/useComputed';
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
    const { commit } = row.node;
    const selectionId = row.node.id;
    const isSelected = useComputed(() => code.selectedCommitId === selectionId, [code, selectionId]);
    const isHead = useComputed(() => code.codeCommitId === (commit?.id ?? null), [code, commit]);
    const isModified = isHead && code.hasUncommittedChanges;

    const handleSelect = () => code.selectCommit(isSelected ? null : selectionId);
    const handleRestore = React.useCallback(() => {
        if (!commit) {
            return code.restoreInitialCode();
        }
        code.restoreCommit(commit);
    }, [code, commit]);

    const title =
        commit?.title ?? translate({ id: 'CodeCommits.Graph.InitialCode', message: 'Ursprünglicher Code' });

    return (
        <div className={clsx(styles.row, isHead && styles.head, isSelected && styles.selected)}>
            <GraphCell row={row} laneCount={laneCount} isHead={isHead} />
            <div className={styles.content}>
                <div className={styles.summary} onClick={handleSelect}>
                    {isHead && (
                        <span className={clsx('badge', 'badge--primary')}>
                            <Translate id="CodeCommits.Entry.Head">HEAD</Translate>
                        </span>
                    )}
                    {isModified && (
                        <span className={clsx('badge', 'badge--warning')}>
                            <Translate id="CodeCommits.Entry.Modified">Geändert</Translate>
                        </span>
                    )}
                    <span className={styles.title}>{title}</span>
                    {commit && <span className={styles.date}>{formatDateTime(commit.createdAt, true)}</span>}
                    {isSelected && <RestoreButton code={code} isHead={isHead} onRestore={handleRestore} />}
                    <PreviewButton code={code} selectionId={selectionId} />
                </div>
                {isSelected && commit?.details && <div className={styles.details}>{commit.details}</div>}
            </div>
        </div>
    );
});

export default CommitRow;
