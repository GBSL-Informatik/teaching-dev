import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import {
    mdiFolderOpen,
    mdiChevronLeft,
    mdiChevronRight,
    mdiFilePlusOutline,
    mdiRenameOutline
} from '@mdi/js';
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

const DesktopSidebar = (props: Props) => {
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
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
            <div className={clsx(styles.sidebarHeader)}>
                {!collapsed && (
                    <>
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
                    </>
                )}
                {!collapsed && <RequestFullscreen targetId={fullscreenTargetId} />}
                <button
                    className={clsx(styles.collapseToggle)}
                    onClick={() => setCollapsed((prev) => !prev)}
                    title={collapsed ? 'Dateiliste einblenden' : 'Dateiliste ausblenden'}
                >
                    <Icon path={collapsed ? mdiChevronRight : mdiChevronLeft} size={0.8} />
                </button>
            </div>
            {!collapsed && dirTree && (
                <div className={clsx(styles.fileTree)}>
                    <Dir
                        dir={dirTree}
                        open={2}
                        path={selectedSrc ? `${dirTree.name}/${selectedSrc}` : undefined}
                        onSelect={onSelect}
                    />
                </div>
            )}
        </div>
    );
};

export default DesktopSidebar;
