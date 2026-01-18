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
    script: iCode<T>;
}

const Editor = observer(<T extends CodeType>(props: Props<T>) => {
    const { script } = props;
    const componentStore = useStore('componentStore');
    const EC = componentStore.editorComponent(script.type);
    return (
        <>
            {EC?.Header ? (
                <EC.Header script={script as unknown as TypeModelMapping[T]} />
            ) : (
                <Header script={script} />
            )}
            <div className={clsx(styles.editorContainer)}>
                <HiddenCode type="pre" script={script} />
                <EditorAce script={script} />
                <HiddenCode type="post" script={script} />
            </div>
            {EC?.Footer && <EC.Footer script={script as unknown as TypeModelMapping[T]} />}
            {EC?.Meta && <EC.Meta script={script as unknown as TypeModelMapping[T]} />}
        </>
    );
});

export default Editor;
