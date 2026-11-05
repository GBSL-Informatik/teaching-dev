import { translate } from '@docusaurus/Translate';
import { mdiBackupRestore, mdiEye, mdiEyeOff } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

interface Props<T extends CodeType> {
    code: iCode<T>;
    isHead: boolean;
    onRestore: () => void;
}

const SelectionActions = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, isHead, onRestore } = props;
    const canRestore = code.canCommit && (!isHead || code.hasUncommittedChanges);

    const handlePreview = (e: React.MouseEvent) => {
        e.stopPropagation();
        code.setPreviewingSelection(!code.isPreviewingSelection);
    };
    const handleRestore = (e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmMessage = translate({
            id: 'CodeCommits.Restore.Confirm',
            message: 'Nicht committete Änderungen gehen verloren. Trotzdem wiederherstellen?'
        });
        if (code.hasUncommittedChanges && !window.confirm(confirmMessage)) {
            return;
        }
        onRestore();
    };

    return (
        <>
            <Button
                icon={code.isPreviewingSelection ? mdiEyeOff : mdiEye}
                onClick={handlePreview}
                color={code.isPreviewingSelection ? Color.Primary : Color.Secondary}
                title={
                    code.isPreviewingSelection
                        ? translate({ id: 'CodeCommits.Entry.HidePreview', message: 'Vorschau beenden' })
                        : translate({
                              id: 'CodeCommits.Entry.ShowPreview',
                              message: 'Code anzeigen (schreibgeschützt)'
                          })
                }
            />
            {canRestore && (
                <Button
                    icon={mdiBackupRestore}
                    onClick={handleRestore}
                    title={translate({ id: 'CodeCommits.Entry.Restore', message: 'Wiederherstellen' })}
                />
            )}
        </>
    );
});

export default SelectionActions;
