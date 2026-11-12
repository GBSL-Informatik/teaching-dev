import { mdiContentSaveAll, mdiLoading, mdiSortAscending, mdiSortDescending, mdiUndo } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import PageStudentGroupFilter from '@tdev-components/shared/PageStudentGroupFilter';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useComputed } from '@tdev-hooks/useComputed';
import { useStore } from '@tdev-hooks/useStore';
import { findCmsTextsWithDraft } from '@tdev-models/documents/CmsText';
import clsx from 'clsx';
import { orderBy } from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';
import React from 'react';
import UserRow from './UserRow';
import styles from './styles.module.scss';

type SortDirection = 'asc' | 'desc';

interface Props {
    /** document root id -> labels */
    cmsAssignments: Record<string, string[]>;
}

const CmsTextEditor = observer((props: Props) => {
    const { cmsAssignments } = props;
    const documentStore = useStore('documentStore');
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');
    const users = useEditableUsers(sortDirection);
    const documentRootIds = React.useMemo(() => Object.keys(cmsAssignments), [cmsAssignments]);
    const docsWithDraft = useComputed(
        () => findCmsTextsWithDraft(documentStore, documentRootIds),
        [documentStore, documentRootIds]
    );
    const hasDrafts = docsWithDraft.length > 0;

    const handleSaveAll = async () => {
        setIsSavingAll(true);
        try {
            for (const doc of docsWithDraft) {
                await doc.saveDraft();
            }
        } finally {
            setIsSavingAll(false);
        }
    };
    const handleToggleSort = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };
    const handleDiscardAll = () => {
        docsWithDraft.forEach((doc) => doc.discardDraft());
    };

    return (
        <div className={clsx(styles.editor)}>
            <PageStudentGroupFilter />
            <div className={clsx(styles.tableWrapper)}>
                <table className={clsx(styles.table)}>
                    <thead>
                        <tr>
                            <th>
                                <Button
                                    text="Name"
                                    icon={sortDirection === 'asc' ? mdiSortAscending : mdiSortDescending}
                                    iconSide="left"
                                    size={SIZE_S}
                                    onClick={handleToggleSort}
                                />
                            </th>
                            {documentRootIds.map((id) => (
                                <th key={id}>
                                    <CopyBadge
                                        value={id}
                                        label={cmsAssignments[id][0] ?? id}
                                        title={`documentRootId kopieren: ${id}`}
                                        color="blue"
                                    />
                                </th>
                            ))}
                            <th>Aktualisiert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <UserRow key={user.id} user={user} documentRootIds={documentRootIds} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={clsx('button-group', 'button-group--block')}>
                <Button
                    text={`Alle verwerfen (${docsWithDraft.length})`}
                    icon={mdiUndo}
                    color="black"
                    onClick={handleDiscardAll}
                    disabled={!hasDrafts || isSavingAll}
                />
                <Button
                    text={`Alle speichern (${docsWithDraft.length})`}
                    icon={isSavingAll ? mdiLoading : mdiContentSaveAll}
                    color="primary"
                    onClick={handleSaveAll}
                    disabled={!hasDrafts || isSavingAll}
                    spin={isSavingAll}
                />
            </div>
        </div>
    );
});

/**
 * The same users as in the user selection of the code import: the students of the viewed group
 * or all managed users.
 */
const useEditableUsers = (sortDirection: SortDirection) => {
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const users = pageStore.current?.viewedStudentGroup?.students || userStore.managedUsers;
    return orderBy(users, ['name'], [sortDirection]);
};

export default CmsTextEditor;
