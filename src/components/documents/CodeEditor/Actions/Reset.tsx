import * as React from 'react';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import { mdiRestore } from '@mdi/js';
import { observer } from 'mobx-react-lite';

const Reset = observer(() => {
    const script = useDocument<'script'>();

    const onReset = () => {
        const shouldReset = window.confirm(
            'Änderungen wirklich verwerfen? Dies kann nicht rückgängig gemacht werden.'
        );
        if (shouldReset) {
            script.setCode(script.meta.initCode);
        }
    };
    return (
        <Button onClick={onReset} title={'Code auf ursprünglichen Zustand zurücksetzen'} icon={mdiRestore} />
    );
});

export default Reset;
