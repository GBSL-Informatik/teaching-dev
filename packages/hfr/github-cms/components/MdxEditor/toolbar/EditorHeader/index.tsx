import { mdiCodeJson, mdiFileCompare, mdiLanguageMarkdown } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type File from '../../../../models/File';
import Actions from '../Actions';
import styles from './styles.module.scss';

interface Props {
    file: File;
    showDiff: boolean;
    onToggleDiff: () => void;
    /** the tools of the current view, e.g. the formatting buttons of the visual editor */
    children?: React.ReactNode;
}

/**
 * The header of the visual and the source editor. The actions, the diff and the view switch
 * stay at the same place in both views.
 */
const EditorHeader = observer(({ file, showDiff, onToggleDiff, children }: Props) => {
    return (
        <div className={clsx(styles.header)}>
            <Actions file={file} />
            {children}
            <div className={clsx(styles.spacer)} />
            <Button
                icon={mdiFileCompare}
                size={SIZE_S}
                title={showDiff ? 'Zurück zum Editor' : 'Änderungen anzeigen'}
                text="Diff"
                iconSide="left"
                active={showDiff}
                disabled={!showDiff && !file.isDirty}
                onClick={onToggleDiff}
            />
            {file.isMarkdown && (
                // shows the view it leads to, icon only: the diff button keeps its place
                <Button
                    icon={file.showsSource ? mdiLanguageMarkdown : mdiCodeJson}
                    size={SIZE_S}
                    title={file.showsSource ? 'Visuellen Editor anzeigen' : 'Markdown-Quelltext bearbeiten'}
                    // the visual editor writes its pending changes to the file when it is unmounted
                    onClick={() => (file.showsSource ? file.showVisual() : file.showSource())}
                />
            )}
        </div>
    );
});

export default EditorHeader;
