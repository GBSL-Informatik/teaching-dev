import * as React from 'react';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { mdiFileCodeOutline, mdiFileDocumentEditOutline, mdiFileEdit } from '@mdi/js';
import type iCode from '@tdev-models/documents/iCode';
import type { CodeType } from '@tdev-api/document';

interface Props<T extends CodeType> {
    script: iCode<T>;
}

const ShowRaw = observer(<T extends CodeType>(props: Props<T>) => {
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
