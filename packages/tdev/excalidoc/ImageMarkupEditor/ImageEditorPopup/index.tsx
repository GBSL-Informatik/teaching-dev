import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { mdiClose, mdiImageEditOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import ImageMarkupEditor from '..';
import type { ExcalidrawImageStorage } from '../storage';
import styles from './styles.module.scss';

interface Props {
    /** the mime type of the edited image, e.g. `image/png` */
    mimeType: string;
    /** called when the popup opens, e.g. to request file access. Null cancels opening */
    openStorage: () => Promise<ExcalidrawImageStorage | null>;
    /** called with the new image path after saving or restoring */
    onImageChanged?: (imagePath: string) => void;
    className?: string;
}

const reportError = (action: string, error: unknown) => {
    console.error(`Error ${action} image:`, error);
    window.alert(`Error ${action} image: ${error}`);
};

/**
 * A button opening the image in the excalidraw editor, in a popup.
 */
const ImageEditorPopup = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [storage, setStorage] = React.useState<ExcalidrawImageStorage | null>(null);
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);

    const handleOpen = async () => {
        const opened = await props.openStorage();
        if (!opened) {
            ref.current?.close();
            return;
        }
        setStorage(opened);
        try {
            setExcaliState(await opened.load());
        } catch (error) {
            reportError('loading', error);
            ref.current?.close();
        }
    };

    const handleSave = async (state: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => {
        try {
            const imagePath = await storage!.save(state, blob, asWebp);
            props.onImageChanged?.(imagePath);
            ref.current?.close();
        } catch (error) {
            reportError('saving', error);
        }
    };

    const handleRestore = async () => {
        try {
            const imagePath = await storage!.restore();
            if (imagePath) {
                props.onImageChanged?.(imagePath);
                ref.current?.close();
            }
        } catch (error) {
            reportError('restoring', error);
        }
    };

    return (
        <Popup
            trigger={
                <span className={clsx(props.className)}>
                    <Button icon={mdiImageEditOutline} size={SIZE_S} title="Mit Excalidraw bearbeiten" />
                </span>
            }
            lockScroll
            closeOnEscape={false}
            nested
            closeOnDocumentClick={false}
            onOpen={handleOpen}
            onClose={() => {
                setExcaliState(null);
                setStorage(null);
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
                        <Button icon={mdiClose} text="Schliessen" onClick={() => ref.current?.close()} />
                    </div>
                }
            >
                {excaliState && (
                    <ImageMarkupEditor
                        initialData={excaliState}
                        mimeType={props.mimeType}
                        onDiscard={() => ref.current?.close()}
                        onSave={handleSave}
                        onRestore={handleRestore}
                    />
                )}
            </Card>
        </Popup>
    );
};

export default ImageEditorPopup;
