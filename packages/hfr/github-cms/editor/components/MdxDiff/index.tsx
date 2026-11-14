import { useColorMode } from '@docusaurus/theme-common';
import { mdiArrowSplitVertical, mdiViewSequential } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type File from '../../../models/File';
import { createSplitDiff, createUnifiedDiff } from './createDiffView';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

/**
 * Shows the changes of the source since the file was loaded or last saved.
 * Each change can be reverted.
 */
const MdxDiff = observer(({ file }: Props) => {
    const { colorMode } = useColorMode();
    const [splitView, setSplitView] = React.useState(true);
    const [mount, setMount] = React.useState<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!mount) {
            return;
        }
        const isDark = colorMode === 'dark';
        const view = splitView
            ? createSplitDiff(mount, file, isDark)
            : createUnifiedDiff(mount, file, isDark);
        return () => view.destroy();
    }, [mount, file, splitView, colorMode]);

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
            {splitView && (
                <div className={clsx(styles.titles)}>
                    <span>Gespeichert</span>
                    <span>Bearbeitet</span>
                </div>
            )}
            <div ref={setMount} />
        </div>
    );
});

export default MdxDiff;
