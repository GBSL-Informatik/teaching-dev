import { mdiEye, mdiEyeOff } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { useComputed } from '@tdev-hooks/useComputed';
import { useStore } from '@tdev-hooks/useStore';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

interface Props<T extends CodeType> {
    code: iCode<T>;
    /** commit id or `INITIAL_CODE_ID` */
    nodeId: string;
}

const PreviewButton = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, nodeId } = props;
    const { codeCommitsView } = useStore('viewStore');
    const isPreviewed = useComputed(
        () => codeCommitsView.isPreviewed(code, nodeId),
        [codeCommitsView, code, nodeId]
    );

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        codeCommitsView.togglePreview(code, nodeId);
    };

    return (
        <Button
            icon={isPreviewed ? mdiEyeOff : mdiEye}
            onClick={handleClick}
            color={isPreviewed ? Color.Primary : Color.Secondary}
            title={isPreviewed ? 'Vorschau beenden' : 'Code anzeigen (schreibgeschützt)'}
        />
    );
});

export default PreviewButton;
