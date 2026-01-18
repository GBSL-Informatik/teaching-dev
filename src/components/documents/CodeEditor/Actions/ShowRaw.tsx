import * as React from 'react';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { mdiFileCodeOutline, mdiFileDocumentEditOutline, mdiFileEdit } from '@mdi/js';
import type iScript from '@tdev-models/documents/iScript';
import type { ScriptTypes } from '@tdev-api/document';

interface Props<T extends ScriptTypes> {
    script: iScript<T>;
}

const ShowRaw = observer(<T extends ScriptTypes>(props: Props<T>) => {
    const { script } = props;

    return (
        <Button
            icon={script.showRaw ? mdiFileDocumentEditOutline : mdiFileCodeOutline}
            onClick={() => script.setShowRaw(!script.showRaw)}
            color={script.showRaw ? Color.Primary : Color.Secondary}
            title={script.showRaw ? 'Zeige bearbeiteten Code' : 'Zeige ursprünglichen Code'}
        />
    );
});

export default ShowRaw;
