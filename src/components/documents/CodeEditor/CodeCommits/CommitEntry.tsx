import Translate, { translate } from '@docusaurus/Translate';
import { mdiBackupRestore, mdiChevronDown, mdiChevronUp } from '@mdi/js';
import Icon from '@mdi/react';
import type { CodeType } from '@tdev-api/document';
import Button from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { formatDateTime } from '@tdev-models/helpers/date';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
    label: string;
    details?: string;
    createdAt?: Date;
    isHead: boolean;
    onRestore: () => void;
}

const CommitEntry = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, label, details, createdAt, isHead, onRestore } = props;
    const [isExpanded, setIsExpanded] = React.useState(false);
    const isModified = isHead && code.hasUncommittedChanges;
    const canRestore = code.canCommit && (!isHead || isModified);

    const handleToggleExpanded = () => setIsExpanded(!isExpanded);
    const handleRestore = (e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmMessage = translate({
            id: 'CodeCommits.Restore.Confirm',
            message: 'Nicht committete Änderungen gehen verloren. Trotzdem wiederherstellen?'
        });
        if (code.hasUncommittedChanges && !window.confirm(confirmMessage)) {
            return;
        }
        onRestore();
    };

    return (
        <div className={clsx(styles.entry, isHead && styles.head)}>
            <div
                className={clsx(styles.summary, details && styles.expandable)}
                onClick={details ? handleToggleExpanded : undefined}
            >
                <span className={styles.dot} />
                <span className={styles.label}>{label}</span>
                {details && <Icon path={isExpanded ? mdiChevronUp : mdiChevronDown} size={0.7} />}
                {createdAt && <span className={styles.date}>{formatDateTime(createdAt, true)}</span>}
                {isHead && (
                    <span className={clsx('badge', 'badge--primary')}>
                        <Translate id="CodeCommits.Entry.Head">Aktuell</Translate>
                    </span>
                )}
                {isModified && (
                    <span className={clsx('badge', 'badge--warning')}>
                        <Translate id="CodeCommits.Entry.Modified">Geändert</Translate>
                    </span>
                )}
                <span className={styles.spacer} />
                {canRestore && (
                    <Button
                        icon={mdiBackupRestore}
                        onClick={handleRestore}
                        title={translate({ id: 'CodeCommits.Entry.Restore', message: 'Wiederherstellen' })}
                    />
                )}
            </div>
            {isExpanded && details && <div className={styles.details}>{details}</div>}
        </div>
    );
});

export default CommitEntry;
