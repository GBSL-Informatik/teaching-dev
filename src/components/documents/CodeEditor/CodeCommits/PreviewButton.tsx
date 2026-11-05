import { translate } from '@docusaurus/Translate';
import { mdiEye, mdiEyeOff } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { useComputed } from '@tdev-hooks/useComputed';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

interface Props<T extends CodeType> {
    code: iCode<T>;
    /** commit id or `INITIAL_CODE_SELECTION` */
    selectionId: string;
}

const PreviewButton = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, selectionId } = props;
    const isPreviewed = useComputed(() => code.previewCommitId === selectionId, [code, selectionId]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        code.previewCommit(isPreviewed ? null : selectionId);
    };

    return (
        <Button
            icon={isPreviewed ? mdiEyeOff : mdiEye}
            onClick={handleClick}
            color={isPreviewed ? Color.Primary : Color.Secondary}
            title={
                isPreviewed
                    ? translate({ id: 'CodeCommits.Preview.Hide', message: 'Vorschau beenden' })
                    : translate({
                          id: 'CodeCommits.Preview.Show',
                          message: 'Code anzeigen (schreibgeschützt)'
                      })
            }
        />
    );
});

export default PreviewButton;
