import { ThemeClassNames } from '@docusaurus/theme-common';
import { mdiClipboardCheck, mdiCloseCircle, mdiLoading } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { CopyState, useCopyState } from '@tdev-hooks/useCopyState';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { copyAsExcalidraw } from '../DomToExcalidraw';
import { ExcalidrawColor, mdiExcalidraw } from '../icons';
import styles from './styles.module.scss';

const CopyIcon: { [key in CopyState]: string } = {
    none: mdiExcalidraw,
    spin: mdiLoading,
    copied: mdiClipboardCheck,
    error: mdiCloseCircle
};
const CopyColor: { [key in CopyState]: string } = {
    none: ExcalidrawColor,
    spin: ExcalidrawColor,
    copied: 'green',
    error: 'red'
};

/**
 * Lets teachers copy the current doc page, or the selected part of it, as Excalidraw elements.
 */
const CopyAsExcalidraw = observer(() => {
    const userStore = useStore('userStore');
    const { copyState, copy } = useCopyState();

    const handleClick = React.useCallback(() => {
        const article = document.querySelector(`.${ThemeClassNames.docs.docMarkdown}`);
        if (!article) {
            return;
        }
        copy(() => copyAsExcalidraw(article));
    }, [copy]);

    if (!userStore.current?.hasElevatedAccess) {
        return null;
    }
    return (
        <div className={clsx(styles.copyAsExcalidraw)}>
            <Button
                text="Als Excalidraw kopieren"
                title="Kopiert die Seite, oder die markierten Abschnitte, um sie in Excalidraw einzufügen."
                icon={CopyIcon[copyState]}
                spin={copyState === 'spin'}
                color={CopyColor[copyState]}
                iconSide="left"
                size={0.8}
                onClick={handleClick}
                disabled={copyState === 'spin'}
            />
        </div>
    );
});

export default CopyAsExcalidraw;
