import { mdiDeleteEmpty, mdiSourceBranch, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import styles from './styles.module.scss';

const documentCount = (count: number) => (count === 1 ? '1 Dokument' : `${count} Dokumente`);

/**
 * The branches with unsaved changes kept in the browser, see `DraftStore`.
 */
const LocalChanges = observer(() => {
    const { drafts, activeBranchName } = useCmsStore();
    const branches = drafts.changedBranches;
    if (branches.length === 0) {
        return null;
    }
    const hasOtherBranches = branches.some(({ branch }) => branch !== activeBranchName);

    return (
        <>
            <h5>Lokale Änderungen</h5>
            <ul className={clsx(styles.branches)}>
                {branches.map(({ branch, count }) => (
                    <li key={branch} className={clsx(styles.branch)}>
                        <Icon path={mdiSourceBranch} size={SIZE_S} />
                        <span className={clsx(styles.name)}>{branch}</span>
                        {branch === activeBranchName && (
                            <span className={clsx('badge', 'badge--primary')}>aktuell</span>
                        )}
                        <span className={clsx(styles.count)}>{documentCount(count)}</span>
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
                    </li>
                ))}
            </ul>
            {hasOtherBranches && (
                <Confirm
                    icon={mdiDeleteEmpty}
                    text="Änderungen der anderen Branches verwerfen"
                    title="Die Änderungen im aktuellen Branch bleiben erhalten"
                    confirmText="Wirklich verwerfen?"
                    confirmColor="red"
                    iconSide="left"
                    size={SIZE_S}
                    onConfirm={() => drafts.discardOtherBranches()}
                />
            )}
        </>
    );
});

export default LocalChanges;
