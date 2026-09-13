import { mdiRestore } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const Reset = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const onReset = () => {
        if (!code.canEdit) {
            return;
        }
        const shouldReset = window.confirm(
            'Änderungen wirklich verwerfen? Dies kann nicht rückgängig gemacht werden.'
        );
        if (shouldReset) {
            code.setCode(code.meta.initCode);
        }
    };
    if (!code.canEdit) {
        return null;
    }
    return (
        <Button
            onClick={onReset}
            disabled={!code.canEdit}
            title={'Code auf ursprünglichen Zustand zurücksetzen'}
            icon={mdiRestore}
        />
    );
});

export default Reset;
