import { mdiContentSaveAll, mdiUndo } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import PageStudentGroupFilter from '@tdev-components/shared/PageStudentGroupFilter';
import { useStore } from '@tdev-hooks/useStore';
import CmsTextDrafts from '@tdev-models/CmsTextDrafts';
import clsx from 'clsx';
import { orderBy } from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';
import EditCell from './EditCell';
import styles from './styles.module.scss';

interface Props {
    drafts: CmsTextDrafts;
    /** document root id -> labels */
    cmsAssignments: Record<string, string[]>;
    monospace?: boolean;
}

const CmsTextEditor = observer((props: Props) => {
    const { drafts, cmsAssignments } = props;
    const users = useEditableUsers();
    const documentRootIds = Object.keys(cmsAssignments);

    const handleSaveAll = () => {
        drafts.saveAll();
    };
    const handleDiscardAll = () => {
        drafts.discardAll();
    };

    return (
        <div className={clsx(styles.editor)}>
            <PageStudentGroupFilter />
            <div className={clsx(styles.tableWrapper)}>
                <table className={clsx(styles.table)}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            {documentRootIds.map((id) => (
                                <th key={id} title={id}>
                                    {cmsAssignments[id][0] ?? id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className={clsx(styles.name)}>{user.name}</td>
                                {documentRootIds.map((id) => (
                                    <EditCell
                                        key={id}
                                        drafts={drafts}
                                        documentRootId={id}
                                        userId={user.id}
                                        monospace={props.monospace}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={clsx('button-group', 'button-group--block')}>
                <Button
                    text="Alle verwerfen"
                    icon={mdiUndo}
                    color="black"
                    onClick={handleDiscardAll}
                    disabled={!drafts.hasDrafts || drafts.isSavingAny}
                />
                <Button
                    text="Alle speichern"
                    icon={mdiContentSaveAll}
                    color="primary"
                    onClick={handleSaveAll}
                    disabled={!drafts.hasDrafts || drafts.isSavingAny}
                    spin={drafts.isSavingAny}
                />
            </div>
        </div>
    );
});

/**
 * The same users as in the user selection of the code import: the students of the viewed group
 * or all managed users.
 */
const useEditableUsers = () => {
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const users = pageStore.current?.viewedStudentGroup?.students || userStore.managedUsers;
    return orderBy(users, ['name'], ['asc']);
};

export default CmsTextEditor;
