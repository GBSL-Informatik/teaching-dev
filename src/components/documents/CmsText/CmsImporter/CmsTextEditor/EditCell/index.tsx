import { mdiContentSave, mdiLoading, mdiUndo } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useComputed } from '@tdev-hooks/useComputed';
import { useStore } from '@tdev-hooks/useStore';
import { findMainCmsText } from '@tdev-models/documents/CmsText';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import CreateCell from '../CreateCell';
import styles from './styles.module.scss';

const MIN_COLUMNS = 20;

interface Props {
    documentRootId: string;
    userId: string;
}

const EditCell = observer((props: Props) => {
    const { documentRootId, userId } = props;
    const documentStore = useStore('documentStore');
    const doc = useComputed(
        () => findMainCmsText(documentStore, documentRootId, userId),
        [documentStore, documentRootId, userId]
    );
    if (!doc) {
        return <CreateCell documentRootId={documentRootId} userId={userId} />;
    }
    const text = doc.draft ?? doc.text;
    const lines = text.split('\n');
    const longestLine = Math.max(...lines.map((line) => line.length));

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        doc.setDraft(e.target.value);
    };
    const handleSave = () => {
        doc.saveDraft();
    };
    const handleDiscard = () => {
        doc.discardDraft();
    };

    return (
        <td className={clsx(styles.cell, doc.hasDraft && styles.dirty)}>
            <div className={clsx(styles.content)}>
                <textarea
                    className={clsx(styles.input)}
                    value={text}
                    rows={lines.length}
                    cols={Math.max(MIN_COLUMNS, longestLine)}
                    onChange={handleChange}
                />
                {doc.hasDraft && (
                    <div className={clsx(styles.actions)}>
                        <Button
                            icon={doc.isSaving ? mdiLoading : mdiContentSave}
                            title="Speichern"
                            color="green"
                            size={SIZE_S}
                            onClick={handleSave}
                            disabled={doc.isSaving}
                            spin={doc.isSaving}
                        />
                        <Button
                            icon={mdiUndo}
                            title="Verwerfen"
                            color="black"
                            size={SIZE_S}
                            onClick={handleDiscard}
                            disabled={doc.isSaving}
                        />
                    </div>
                )}
            </div>
        </td>
    );
});

export default EditCell;
