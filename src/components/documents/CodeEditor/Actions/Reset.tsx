import * as React from 'react';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { mdiRestore } from '@mdi/js';
import { observer } from 'mobx-react-lite';
import type { ScriptTypes } from '@tdev-api/document';
import type iScript from '@tdev-models/documents/iScript';

interface Props<T extends ScriptTypes> {
    script: iScript<T>;
}

const Reset = observer(<T extends ScriptTypes>(props: Props<T>) => {
    const { script } = props;
    const onReset = React.useEffectEvent(() => {
        const shouldReset = window.confirm(
            'Änderungen wirklich verwerfen? Dies kann nicht rückgängig gemacht werden.'
        );
        if (shouldReset) {
            script.setCode(script.meta.initCode);
        }
    });
    return (
        <Button onClick={onReset} title={'Code auf ursprünglichen Zustand zurücksetzen'} icon={mdiRestore} />
    );
});

export default Reset;
