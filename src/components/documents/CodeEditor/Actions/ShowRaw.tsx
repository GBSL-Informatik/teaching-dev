import { mdiFileCodeOutline, mdiFileDocumentEditOutline } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

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
