import { mdiDeleteEmpty } from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import BranchChanges from './BranchChanges';
import styles from './styles.module.scss';

interface Props {
    /** called after navigating to a changed file, e.g. to close the modal */
    onNavigate?: () => void;
}

/**
 * The branches with unsaved changes kept in the browser, see `DraftStore`.
 */
const LocalChanges = observer(({ onNavigate }: Props) => {
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
                {branches.map((changes) => (
                    <BranchChanges key={changes.branch} changes={changes} onNavigate={onNavigate} />
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
