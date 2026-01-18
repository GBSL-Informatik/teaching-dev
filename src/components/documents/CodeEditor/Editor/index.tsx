import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import HiddenCode from './HiddenCode';
import EditorAce from './EditorAce';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

import type { ScriptTypes, TypeModelMapping } from '@tdev-api/document';
import type iScript from '@tdev-models/documents/iScript';

interface Props<T extends ScriptTypes> {
    script: iScript<T>;
}

const Editor = observer(<T extends ScriptTypes>(props: Props<T>) => {
    const { script } = props;
    console.log('Rendering Editor for script:', script.id);
    const componentStore = useStore('componentStore');
    const EC = componentStore.editorComponent(script.type);
    return (
        <React.Fragment>
            {EC?.Header && <EC.Header script={script as unknown as TypeModelMapping[T]} />}
            <div className={clsx(styles.editorContainer)}>
                <HiddenCode type="pre" script={script} />
                <EditorAce script={script} />
                <HiddenCode type="post" script={script} />
            </div>
            {EC?.Logs && <EC.Logs script={script as unknown as TypeModelMapping[T]} />}
            {EC?.Meta && <EC.Meta script={script as unknown as TypeModelMapping[T]} />}
        </React.Fragment>
    );
});

export default Editor;
