import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import MdxDiff from '../../../editor/components/MdxDiff';
import SourceEditor from '../../../editor/SourceEditor';
import File from '../../../models/File';
import EditorHeader from '../../MdxEditor/toolbar/EditorHeader';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

/**
 * Edits the source of a text file. The source editor is recreated after the diff is closed,
 * so that it shows the reverted changes. For markdown, it shows why the visual editor is not available.
 */
const DefaultEditor = observer((props: Props) => {
    const { file } = props;
    const [showDiff, setShowDiff] = React.useState(false);
    if (!file || file.type !== 'file') {
        return null;
    }

    return (
        <div className={clsx(styles.codeEditor)}>
            <EditorHeader file={file} showDiff={showDiff} onToggleDiff={() => setShowDiff(!showDiff)} />
            {file.sourceReason && (
                <div className={clsx('alert', 'alert--warning', styles.warning)} role="alert">
                    Die Datei kann nicht im visuellen Editor geöffnet werden: {file.sourceReason}
                </div>
            )}
            {showDiff ? <MdxDiff file={file} /> : <SourceEditor file={file} />}
        </div>
    );
});

export default DefaultEditor;
