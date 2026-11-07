import { useColorMode } from '@docusaurus/theme-common';
import { mdiArrowSplitVertical, mdiViewSequential } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import type File from '../../../models/File';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

/**
 * Shows the changes of the markdown source since the file was loaded or last saved.
 */
const MdxDiff = observer(({ file }: Props) => {
    const { colorMode } = useColorMode();
    const [splitView, setSplitView] = React.useState(true);
    if (!file.isDirty) {
        return <div className={clsx(styles.noChanges)}>Keine Änderungen</div>;
    }
    return (
        <div className={clsx(styles.diff)}>
            <div className={clsx(styles.options)}>
                <Button
                    icon={splitView ? mdiViewSequential : mdiArrowSplitVertical}
                    text={splitView ? 'Untereinander' : 'Nebeneinander'}
                    iconSide="left"
                    size={SIZE_S}
                    onClick={() => setSplitView(!splitView)}
                />
            </div>
            <DiffViewer
                oldValue={file._pristine}
                newValue={file.content}
                splitView={splitView}
                leftTitle="Gespeichert"
                rightTitle="Bearbeitet"
                compareMethod={DiffMethod.WORDS}
                showDiffOnly
                extraLinesSurroundingDiff={2}
                useDarkTheme={colorMode === 'dark'}
            />
        </div>
    );
});

export default MdxDiff;
