import * as React from 'react';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { mdiRestore } from '@mdi/js';
import { observer } from 'mobx-react-lite';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const Reset = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const onReset = React.useEffectEvent(() => {
        const shouldReset = window.confirm(
            'Änderungen wirklich verwerfen? Dies kann nicht rückgängig gemacht werden.'
        );
        if (shouldReset) {
            code.setCode(code.meta.initCode);
        }
    });
    return (
        <Button onClick={onReset} title={'Code auf ursprünglichen Zustand zurücksetzen'} icon={mdiRestore} />
    );
});

export default Reset;
