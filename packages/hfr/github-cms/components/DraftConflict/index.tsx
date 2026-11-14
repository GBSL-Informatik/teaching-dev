import { useColorMode } from '@docusaurus/theme-common';
import { mdiCheck, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { formatDateTime } from '@tdev-models/helpers/date';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { createComparison } from '../../editor/components/MdxDiff/createDiffView';
import { useCmsStore } from '../../hooks/useCmsStore';
import type File from '../../models/File';
import type { Draft } from '../../stores/DraftStore/draftDb';
import styles from './styles.module.scss';

interface Props {
    file: File;
    draft: Draft;
}

/**
 * The file changed on github since its unsaved changes were kept in the browser:
 * shows both versions, the user chooses which one to edit.
 */
const DraftConflict = observer(({ file, draft }: Props) => {
    const { drafts } = useCmsStore();
    const { colorMode } = useColorMode();
    const [mount, setMount] = React.useState<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!mount) {
            return;
        }
        const view = createComparison(mount, file, file.content, draft.content, colorMode === 'dark');
        return () => view.destroy();
    }, [mount, file, draft, colorMode]);

    return (
        <div className={clsx(styles.conflict)}>
            <div className={clsx('alert', 'alert--warning')} role="alert">
                <p>
                    Du hast <strong>{file.name}</strong> am {formatDateTime(new Date(draft.savedAt), true)}{' '}
                    bearbeitet, ohne zu speichern. Seither wurde die Datei auf GitHub geändert. Welche Version
                    möchtest du weiter bearbeiten?
                </p>
                <div className={clsx(styles.actions)}>
                    <Button
                        icon={mdiCheck}
                        text="Meine Änderungen"
                        title="Beim Speichern ersetzen deine Änderungen die Version auf GitHub"
                        iconSide="left"
                        color="primary"
                        size={SIZE_S}
                        onClick={() => drafts.applyOutdatedDraft(file)}
                    />
                    <Confirm
                        icon={mdiTrashCanOutline}
                        confirmIcon={mdiTrashCan}
                        text="Version von GitHub"
                        title="Deine ungespeicherten Änderungen werden verworfen"
                        confirmText="Meine Änderungen verwerfen?"
                        color="red"
                        iconSide="left"
                        size={SIZE_S}
                        onConfirm={() => drafts.remove(file.branch, file.path)}
                    />
                </div>
            </div>
            <div className={clsx(styles.legend)}>
                <span className={clsx(styles.removed)}>Version auf GitHub</span>
                <span className={clsx(styles.added)}>Meine Änderungen</span>
            </div>
            <div ref={setMount} />
        </div>
    );
});

export default DraftConflict;
