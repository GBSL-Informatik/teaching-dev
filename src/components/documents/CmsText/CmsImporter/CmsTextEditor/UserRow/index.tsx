import { useComputed } from '@tdev-hooks/useComputed';
import { useStore } from '@tdev-hooks/useStore';
import { findMainCmsText } from '@tdev-models/documents/CmsText';
import { formatDateTime } from '@tdev-models/helpers/date';
import User from '@tdev-models/User';
import DocumentStore from '@tdev-stores/DocumentStore';
import clsx from 'clsx';
import { maxBy } from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';
import EditCell from '../EditCell';
import styles from './styles.module.scss';

interface Props {
    user: User;
    documentRootIds: string[];
}

/**
 * @returns the latest update of the user's main cms texts in the given document roots
 */
const findLastCmsTextUpdate = (
    documentStore: DocumentStore,
    documentRootIds: string[],
    userId: string
): Date | undefined => {
    const updates = documentRootIds
        .map((documentRootId) => findMainCmsText(documentStore, documentRootId, userId)?.updatedAt)
        .filter((updatedAt) => !!updatedAt);
    return maxBy(updates, (updatedAt) => updatedAt.getTime());
};

const UserRow = observer((props: Props) => {
    const { user, documentRootIds } = props;
    const documentStore = useStore('documentStore');
    const lastUpdate = useComputed(
        () => findLastCmsTextUpdate(documentStore, documentRootIds, user.id),
        [documentStore, documentRootIds, user]
    );

    return (
        <tr>
            <td className={clsx(styles.name)} title={user.email}>
                {user.nameShort}
            </td>
            {documentRootIds.map((id) => (
                <EditCell key={id} documentRootId={id} userId={user.id} />
            ))}
            <td className={clsx(styles.updatedAt)}>{lastUpdate && formatDateTime(lastUpdate, true)}</td>
        </tr>
    );
});

export default UserRow;
