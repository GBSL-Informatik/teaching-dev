import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import HiddenCode from './HiddenCode';
import EditorAce from './EditorAce';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

import type { CodeType, TypeModelMapping } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import Header from './Header';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const Editor = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const componentStore = useStore('componentStore');
    const EC = componentStore.editorComponent(code.type);
    return (
        <>
            {EC?.Header ? (
                <EC.Header code={code as unknown as TypeModelMapping[T]} />
            ) : (
                <Header code={code} />
            )}
            <div className={clsx(styles.editorContainer)}>
                <HiddenCode type="pre" code={code} />
                <EditorAce code={code} />
                <HiddenCode type="post" code={code} />
            </div>
            {EC?.Footer && <EC.Footer code={code as unknown as TypeModelMapping[T]} />}
            {EC?.Meta && <EC.Meta code={code as unknown as TypeModelMapping[T]} />}
        </>
    );
});

export default Editor;
