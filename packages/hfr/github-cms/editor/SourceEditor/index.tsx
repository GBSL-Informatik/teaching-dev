import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type File from '../../models/File';
import { createSourceView } from './createSourceView';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

/**
 * Edits the source of a text file, e.g. markdown or typescript. Like in the visual editor,
 * uuids are highlighted and can be replaced with a new one.
 */
const SourceEditor = observer(({ file }: Props) => {
    const [mount, setMount] = React.useState<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!mount) {
            return;
        }
        const view = createSourceView(mount, file);
        return () => view.destroy();
    }, [mount, file]);

    return <div ref={setMount} className={clsx(styles.sourceEditor)} />;
});

export default SourceEditor;
