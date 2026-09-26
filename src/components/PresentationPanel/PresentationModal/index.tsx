import { useColorMode } from '@docusaurus/theme-common';
import { mdiPresentationPlay } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import type { default as PresentationPanelLib } from '..';
import styles from './styles.module.scss';

interface Props {}

const PresentationModal = observer((props: Props) => {
    const documentStore = useStore('documentStore');
    const viewStore = useStore('viewStore');
    const { colorMode } = useColorMode();

    const PresentationPanel = useClientLib<typeof PresentationPanelLib>(
        () => import('@tdev-components/PresentationPanel').then((d) => d.default),
        '@tdev-components/PresentationPanel'
    );
    if (!PresentationPanel) {
        return null;
    }
    const hasDocs = documentStore.presentedDocuments.length > 0;
    if (hasDocs && viewStore.presentationPanelState === 'closed') {
        return (
            <div className={clsx(styles.presentationModalClosed)}>
                <Button
                    icon={mdiPresentationPlay}
                    onClick={() => {
                        viewStore.setPresentationPanelState('open');
                    }}
                    text="Präsentation fortsetzen"
                    iconSide="left"
                    color="orange"
                    noOutline
                />
            </div>
        );
    }

    return (
        <Popup
            modal
            overlayStyle={{
                background: colorMode === 'dark' ? 'rgba(0, 0, 0, 0.84)' : 'rgba(226, 222, 222, 0.84)',
                maxWidth: '100vw'
            }}
            contentStyle={{
                minHeight: 'min(700px, 90vh, 100%)',
                maxHeight: 'calc(99vh - 40px)'
            }}
            open={hasDocs}
            lockScroll
            repositionOnResize
            closeOnDocumentClick={false}
            closeOnEscape={false}
        >
            <PresentationPanel />
        </Popup>
    );
});

export default PresentationModal;
