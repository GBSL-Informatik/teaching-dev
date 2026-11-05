import Translate from '@docusaurus/Translate';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';
import Icon from '@mdi/react';
import type { CodeType } from '@tdev-api/document';
import { useComputed } from '@tdev-hooks/useComputed';
import type iCode from '@tdev-models/documents/iCode';
import { formatDateTime } from '@tdev-models/helpers/date';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import SelectionActions from './SelectionActions';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
    /** commit id or `INITIAL_CODE_SELECTION` */
    selectionId: string;
    label: string;
    details?: string;
    createdAt?: Date;
    isHead: boolean;
    onRestore: () => void;
}

const CommitEntry = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, selectionId, label, details, createdAt, isHead, onRestore } = props;
    const isSelected = useComputed(() => code.selectedCommitId === selectionId, [code, selectionId]);
    const isModified = isHead && code.hasUncommittedChanges;

    const handleSelect = () => code.selectCommit(isSelected ? null : selectionId);

    return (
        <div className={clsx(styles.entry, isHead && styles.head, isSelected && styles.selected)}>
            <div className={styles.summary} onClick={handleSelect}>
                <span className={styles.dot} />
                <span className={styles.label}>{label}</span>
                {details && <Icon path={isSelected ? mdiChevronUp : mdiChevronDown} size={0.7} />}
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
                {isSelected && <SelectionActions code={code} isHead={isHead} onRestore={onRestore} />}
            </div>
            {isSelected && details && <div className={styles.details}>{details}</div>}
        </div>
    );
});

export default CommitEntry;
