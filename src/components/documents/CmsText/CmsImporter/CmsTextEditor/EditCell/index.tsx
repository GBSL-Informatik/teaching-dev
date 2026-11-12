import { mdiContentSave, mdiUndo } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import CmsTextDrafts from '@tdev-models/CmsTextDrafts';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface Props {
    drafts: CmsTextDrafts;
    documentRootId: string;
    userId: string;
    monospace?: boolean;
}

const EditCell = observer((props: Props) => {
    const { drafts, documentRootId, userId } = props;
    const draftText = drafts.draftText(documentRootId, userId);
    const isDirty = draftText !== undefined;
    const text = draftText ?? drafts.savedText(documentRootId, userId);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        drafts.setDraft(documentRootId, userId, e.target.value);
    };
    const handleSave = () => {
        drafts.save(documentRootId, userId);
    };
    const handleDiscard = () => {
        drafts.discard(documentRootId, userId);
    };

    return (
        <td className={clsx(styles.cell, isDirty && styles.dirty)}>
            <textarea
                className={clsx(styles.input, props.monospace && styles.monospace)}
                value={text}
                rows={text.split('\n').length}
                onChange={handleChange}
            />
            {isDirty && (
                <div className={clsx(styles.actions)}>
                    <Button
                        icon={mdiContentSave}
                        title="Speichern"
                        color="green"
                        size={SIZE_S}
                        onClick={handleSave}
                    />
                    <Button
                        icon={mdiUndo}
                        title="Verwerfen"
                        color="black"
                        size={SIZE_S}
                        onClick={handleDiscard}
                    />
                </div>
            )}
        </td>
    );
});

export default EditCell;
