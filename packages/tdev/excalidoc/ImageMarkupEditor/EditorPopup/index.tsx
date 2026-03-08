import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Card from '@tdev-components/shared/Card';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { mdiClose, mdiImageEditOutline } from '@mdi/js';
import ImageMarkupEditor from '..';
import requestDocusaurusRootAcess from '@tdev-components/util/localFS/requestDocusaurusRootAcess';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { PopupActions } from 'reactjs-popup/dist/types';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import loadExcalidrawState from '../helpers/loadExcalidrawState';
import saveExcalidrawToFs from '../helpers/saveExcalidrawToFs';
import restoreExcalidrawFromFs from '../helpers/restoreExcalidrawFromFs';

interface Props {
    src: string;
    className?: string;
}

const EditorPopup = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');
    const ref = React.useRef<PopupActions>(null);
    const { excaliName, excaliSrc, imgName, mimeType } = React.useMemo(
        () => extractExalidrawImageName(props.src),
        [props.src]
    );
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);

    return (
        <Popup
            trigger={
                <span className={clsx(props.className)}>
                    <Button icon={mdiImageEditOutline} size={SIZE_S} />
                </span>
            }
            lockScroll
            closeOnEscape={false}
            nested
            closeOnDocumentClick={false}
            onOpen={async () => {
                if (!sessionStore.fileSystemDirectoryHandles.get('root')) {
                    const result = await requestDocusaurusRootAcess();
                    if (!result) {
                        ref.current?.close();
                        return;
                    }
                }
                const root = sessionStore.fileSystemDirectoryHandles.get('root');
                if (!root) {
                    window.alert('Kein Zugriff auf lokale Dateien. Bitte aktiviere den Zugriff.');
                    return;
                }
                try {
                    const data = await loadExcalidrawState(root, props.src);
                    setExcaliState(data);
                } catch (error) {
                    console.error('Error processing image:', error);
                    window.alert(`Error processing image: ${error}`);
                }
            }}
            onClose={() => {
                setExcaliState(null);
            }}
            ref={ref}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card
                classNames={{ body: clsx(styles.body), card: clsx(styles.card) }}
                header={
                    <div className={clsx(styles.header)}>
                        <h3>Bild bearbeiten</h3>
                        <Button
                            icon={mdiClose}
                            text="Schliessen"
                            onClick={() => {
                                ref.current?.close();
                            }}
                        />
                    </div>
                }
            >
                {excaliState && (
                    <ImageMarkupEditor
                        initialData={excaliState}
                        mimeType={mimeType}
                        onDiscard={() => {
                            ref.current?.close();
                        }}
                        onSave={async (state, blob, asWebp) => {
                            const root = sessionStore.fileSystemDirectoryHandles.get('root');
                            await saveExcalidrawToFs(
                                root!,
                                props.src,
                                excaliSrc,
                                imgName,
                                state,
                                blob,
                                asWebp
                            );
                            ref.current?.close();
                        }}
                        onRestore={async () => {
                            const root = sessionStore.fileSystemDirectoryHandles.get('root');
                            const restored = await restoreExcalidrawFromFs(
                                root!,
                                excaliSrc,
                                excaliName,
                                imgName
                            );
                            if (restored) {
                                ref.current?.close();
                            }
                        }}
                    />
                )}
            </Card>
        </Popup>
    );
});

export default EditorPopup;
