import { translate } from '@docusaurus/Translate';
import { mdiBackupRestore } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

interface Props<T extends CodeType> {
    code: iCode<T>;
    isHead: boolean;
    onRestore: () => void;
}

const RestoreButton = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, isHead, onRestore } = props;
    const canRestore = code.canCommit && (!isHead || code.hasUncommittedChanges);

    const handleClick = (e: React.MouseEvent) => {
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

    if (!canRestore) {
        return null;
    }
    return (
        <Button
            icon={mdiBackupRestore}
            onClick={handleClick}
            title={translate({ id: 'CodeCommits.Entry.Restore', message: 'Wiederherstellen' })}
        />
    );
});

export default RestoreButton;
