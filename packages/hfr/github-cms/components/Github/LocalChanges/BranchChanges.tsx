import {
    mdiChevronDown,
    mdiChevronRight,
    mdiFileDocumentOutline,
    mdiTrashCan,
    mdiTrashCanOutline
} from '@mdi/js';
import Icon from '@mdi/react';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type { BranchChanges as Changes } from '../../../stores/DraftStore';
import styles from './styles.module.scss';

const documentCount = (count: number) => (count === 1 ? '1 Dokument' : `${count} Dokumente`);

interface Props {
    changes: Changes;
    /** called after navigating to a changed file, e.g. to close the modal */
    onNavigate?: () => void;
}

/**
 * A branch with local changes. Clicking its name shows the changed files, which can be opened.
 */
const BranchChanges = observer(({ changes, onNavigate }: Props) => {
    const cmsStore = useCmsStore();
    const { drafts, activeBranchName } = cmsStore;
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { branch, paths } = changes;

    const handleOpen = (path: string) => {
        cmsStore.triggerNavigateToFile(branch, path);
        onNavigate?.();
    };

    return (
        <li>
            <div className={clsx(styles.branch)}>
                <button
                    type="button"
                    className={clsx('clean-btn', styles.toggle)}
                    title={isExpanded ? 'Geänderte Dateien ausblenden' : 'Geänderte Dateien anzeigen'}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Icon path={isExpanded ? mdiChevronDown : mdiChevronRight} size={SIZE_S} />
                    <span className={clsx(styles.name)}>{branch}</span>
                </button>
                {branch === activeBranchName && (
                    <span className={clsx('badge', 'badge--primary')}>aktuell</span>
                )}
                <span className={clsx(styles.count)}>{documentCount(paths.length)}</span>
                <Confirm
                    icon={mdiTrashCanOutline}
                    confirmIcon={mdiTrashCan}
                    text={null}
                    title={`Lokale Änderungen in ${branch} verwerfen`}
                    confirmText="Verwerfen?"
                    confirmColor="red"
                    size={SIZE_S}
                    onConfirm={() => drafts.discardBranch(branch)}
                />
            </div>
            {isExpanded && (
                <ul className={clsx(styles.files)}>
                    {paths.map((path) => (
                        <li key={path}>
                            <button
                                type="button"
                                className={clsx('clean-btn', styles.file)}
                                title={`${path} öffnen`}
                                onClick={() => handleOpen(path)}
                            >
                                <Icon path={mdiFileDocumentOutline} size={SIZE_S} />
                                {path}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
});

export default BranchChanges;
