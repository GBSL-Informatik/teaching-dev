import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import { mdiFolderOpen, mdiFileTree, mdiClose, mdiFilePlusOutline, mdiRenameOutline } from '@mdi/js';
import Dir, { DirType } from '@tdev-components/FileSystem/Dir';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';

interface Props {
    fullscreenTargetId: string;
    dirHandle: FileSystemDirectoryHandle | null;
    dirTree: DirType | null;
    selectedSrc: string | null;
    onSelectFolder: () => void;
    onSelect: (fName?: string) => void;
    onCreateNewDrawing: () => void;
    onRenameImage: () => void;
}

const MobileSidebar = (props: Props) => {
    const {
        fullscreenTargetId,
        dirHandle,
        dirTree,
        selectedSrc,
        onSelectFolder,
        onSelect,
        onCreateNewDrawing,
        onRenameImage
    } = props;
    const [treeOpen, setTreeOpen] = React.useState(false);

    const onMobileSelect = React.useCallback(
        (fName?: string) => {
            onSelect(fName);
            setTreeOpen(false);
        },
        [onSelect]
    );

    return (
        <>
            {treeOpen && (
                <div className={clsx(styles.mobileOverlay)}>
                    <div className={clsx(styles.mobileOverlayHeader)}>
                        <Button
                            icon={mdiFolderOpen}
                            title="Ordner auswählen"
                            onClick={onSelectFolder}
                            color="primary"
                        />
                        {dirHandle && (
                            <Button
                                icon={mdiFilePlusOutline}
                                title="Neue Zeichnung erstellen"
                                onClick={onCreateNewDrawing}
                                color="primary"
                            />
                        )}
                        {selectedSrc && (
                            <Button
                                icon={mdiRenameOutline}
                                title="Bild umbenennen"
                                onClick={onRenameImage}
                                color="primary"
                            />
                        )}
                        <button
                            className={clsx(styles.collapseToggle)}
                            onClick={() => setTreeOpen(false)}
                            title="Dateiliste schliessen"
                        >
                            <Icon path={mdiClose} size={0.8} />
                        </button>
                    </div>
                    {dirTree && (
                        <div className={clsx(styles.fileTree)}>
                            <Dir
                                dir={dirTree}
                                open={2}
                                path={selectedSrc ? `${dirTree.name}/${selectedSrc}` : undefined}
                                onSelect={onMobileSelect}
                            />
                        </div>
                    )}
                </div>
            )}
            <div className={clsx(styles.mobileToolbar)}>
                <button
                    className={clsx(styles.collapseToggle)}
                    onClick={() => setTreeOpen(true)}
                    title="Dateiliste anzeigen"
                >
                    <Icon path={mdiFileTree} size={0.8} />
                </button>
                {!dirHandle && (
                    <Button
                        icon={mdiFolderOpen}
                        text="Ordner"
                        title="Ordner auswählen"
                        onClick={onSelectFolder}
                        color="primary"
                    />
                )}
                <RequestFullscreen targetId={fullscreenTargetId} />
            </div>
        </>
    );
};

export default MobileSidebar;
