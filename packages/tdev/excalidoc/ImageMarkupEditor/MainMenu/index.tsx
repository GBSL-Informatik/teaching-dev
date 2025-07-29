import React from 'react';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import onSaveCallback, { OnSave } from '../helpers/onSaveCallback';
import { mdiContentSave, mdiImageMove, mdiRestoreAlert } from '@mdi/js';
import Icon from '@mdi/react';

interface Props {
    Lib: typeof ExcalidrawLib;
    api: ExcalidrawImperativeAPI;
    onSave?: OnSave;
    onRestore?: () => void;
    hasChanges: boolean;
}

const MainMenu = (props: Props) => {
    const { Lib, api, onSave, onRestore, hasChanges } = props;

    return (
        <Lib.MainMenu>
            {hasChanges && (
                <Lib.MainMenu.Item
                    onSelect={() => onSaveCallback(Lib, onSave, api, false)}
                    shortcut="Ctrl+S"
                    icon={<Icon path={mdiContentSave} size={0.7} color="var(--ifm-color-success)" />}
                >
                    Speichern
                </Lib.MainMenu.Item>
            )}
            <Lib.MainMenu.DefaultItems.Export />
            <Lib.MainMenu.DefaultItems.SaveAsImage />
            {onSave && (
                <Lib.MainMenu.Item
                    onSelect={() => onSaveCallback(Lib, onSave, api, true)}
                    icon={<Icon path={mdiImageMove} size={0.7} />}
                    title="Achtung, die referenzierenden Markdown-Dateien müssen manuell angepasst werden!"
                >
                    Als WebP speichern
                </Lib.MainMenu.Item>
            )}
            {onRestore && (
                <Lib.MainMenu.Item
                    onSelect={() => onRestore!()}
                    icon={<Icon path={mdiRestoreAlert} size={0.7} color="var(--ifm-color-danger)" />}
                    title="Achtung! Alle Änderungen gehen verloren!"
                >
                    Original Wiederherstellen
                </Lib.MainMenu.Item>
            )}
        </Lib.MainMenu>
    );
};

export default MainMenu;
