import * as React from 'react';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { mdiFileCodeOutline, mdiFileDocumentEditOutline, mdiFileEdit } from '@mdi/js';
import type iCode from '@tdev-models/documents/iCode';
import type { CodeType } from '@tdev-api/document';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const ShowRaw = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;

    return (
        <Button
            icon={code.showRaw ? mdiFileDocumentEditOutline : mdiFileCodeOutline}
            onClick={() => code.setShowRaw(!code.showRaw)}
            color={code.showRaw ? Color.Primary : Color.Secondary}
            title={code.showRaw ? 'Zeige bearbeiteten Code' : 'Zeige ursprünglichen Code'}
        />
    );
});

export default ShowRaw;
