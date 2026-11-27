import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import type { LibraryItems } from '@excalidraw/excalidraw/types';
import { mdiCircleEditOutline, mdiClose, mdiLoading } from '@mdi/js';
import Loader from '@tdev-components/Loader';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import SyncStatus from '@tdev-components/SyncStatus';
import Button from '@tdev-components/shared/Button';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { useStore } from '@tdev-hooks/useStore';
import { MetaInit, ModelMeta } from '@tdev/excalidoc/model/ModelMeta';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { default as ExcalidocModel } from '../model';
import Editor from './Editor';
import Preview from './Preview';
import Image from './Preview/Image';
import styles from './styles.module.scss';

export const DEFAULT_HEIGHT = '600px' as const;
export { ExcalidrawColor, mdiExcalidraw, mdiExcalidrawOutline } from '../icons';

interface ExcaliProps {
    id: string;
    height?: string;
    allowImageInsertion?: boolean;
    libraryItems?: LibraryItems;
    useExcalidrawViewer?: boolean;
}
export interface Props extends MetaInit, ExcaliProps {}

const Excalidoc = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), []);
    const doc = useFirstRealMainDocument(props.id, meta);

    if (!doc) {
        return <Loader />;
    }
    if (!doc.canDisplay) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
                <Image />
            </div>
        );
    }
    return <ExcalidocComponent {...props} doc={doc} />;
});

export const ExcalidocComponent = observer(
    (
        props: Omit<ExcaliProps, 'id'> & {
            doc: ExcalidocModel;
            onEdit?: (edit: boolean) => void;
            onlyCommitValidChanges?: boolean;
            zenMode?: boolean;
        }
    ) => {
        const { doc } = props;
        const [edit, setEdit] = React.useState(false);
        const viewStore = useStore('viewStore');
        const Lib = useClientLib<typeof ExcalidrawLib>(
            () => import('@excalidraw/excalidraw'),
            '@excalidraw/excalidraw'
        );
        const id = React.useId();
        const onEdit = React.useCallback(
            (edit: boolean) => {
                setEdit(edit);
                props.onEdit?.(edit);
            },
            [props.onEdit]
        );

        if (!doc) {
            return <Loader />;
        }
        if (!Lib || (!edit && !props.useExcalidrawViewer)) {
            return (
                <div className={clsx('card', styles.excalidraw, styles.preview)}>
                    <div className={clsx(styles.actions)}>
                        <SyncStatus model={doc} />
                        <PermissionsPanel documentRootId={doc.documentRootId} />
                        <Button
                            icon={Lib ? mdiCircleEditOutline : mdiLoading}
                            spin={!Lib}
                            onClick={() => onEdit(true)}
                            color="orange"
                            className={clsx(styles.edit)}
                            disabled={!Lib}
                        />
                    </div>
                    <Preview documentId={doc.id} />
                </div>
            );
        }
        return (
            <div
                style={{ height: props.height || DEFAULT_HEIGHT, width: '100%' }}
                className={clsx(styles.excalidraw, viewStore.isFullscreenTarget(id) && styles.fullscreen)}
                id={id}
            >
                <div className={styles.actions}>
                    <SyncStatus model={doc} />
                    <PermissionsPanel documentRootId={doc.documentRootId} />
                    {props.useExcalidrawViewer && !edit && (
                        <Button
                            icon={Lib ? mdiCircleEditOutline : mdiLoading}
                            spin={!Lib}
                            onClick={() => onEdit(true)}
                            color="orange"
                            className={clsx(styles.edit)}
                            disabled={!Lib}
                        />
                    )}
                    {edit && (
                        <>
                            <RequestFullscreen targetId={id} />
                            <Button
                                onClick={() => {
                                    onEdit(false);
                                    viewStore.exitFullscreen();
                                }}
                                icon={mdiClose}
                                color="red"
                                title="Bearbeitung beenden"
                            />
                        </>
                    )}
                </div>
                <Editor
                    Lib={Lib}
                    documentId={doc.id}
                    libraryItems={props.libraryItems}
                    allowImageInsertion={props.allowImageInsertion}
                    readonly={!edit}
                />
            </div>
        );
    }
);

export default Excalidoc;
