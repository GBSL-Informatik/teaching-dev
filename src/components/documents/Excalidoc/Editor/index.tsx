import React from 'react';
import { observer } from 'mobx-react-lite';
import { MetaInit, ModelMeta } from '@site/src/models/documents/Excalidoc';
import type { ExcalidrawImperativeAPI, LibraryItems } from '@excalidraw/excalidraw/types/types';
import { Source } from '@tdev-models/iDocument';
import { reaction } from 'mobx';
import { useColorMode } from '@docusaurus/theme-common';
import type { default as ExcalidrawLib } from '@excalidraw/excalidraw';
import _ from 'lodash';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';

export interface Props extends MetaInit {
    Lib: typeof ExcalidrawLib;
    id: string;
    meta: ModelMeta;
    libraryItems?: LibraryItems;
    allowImageInsertion?: boolean;
    readonly?: boolean;
}

const Editor = observer((props: Props) => {
    const { Lib, meta } = props;
    const excalidoc = useFirstRealMainDocument(props.id, meta);
    const renderedSceneVersion = React.useRef(0);
    const initialized = React.useRef<boolean>(false);
    const apiSceneVersion = React.useRef(0);
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI>();
    const { colorMode } = useColorMode();
    React.useEffect(() => {
        if (excalidrawAPI && excalidoc && !initialized.current) {
            excalidrawAPI.scrollToContent(excalidoc.elements, { fitToViewport: true });
            renderedSceneVersion.current = Lib.getSceneVersion(excalidoc.elements);
            apiSceneVersion.current = renderedSceneVersion.current;
            const onChangeDisposer = excalidrawAPI.onChange((elements, appState, files) => {
                const version = Lib.getSceneVersion(elements);
                if (version === renderedSceneVersion.current) {
                    return;
                }
                renderedSceneVersion.current = version;
                const nonDeletedElements = Lib.getNonDeletedElements(elements);
                apiSceneVersion.current = Lib.getSceneVersion(nonDeletedElements);
                excalidoc.setData(
                    {
                        image: '',
                        files: files,
                        elements: nonDeletedElements
                    },
                    Source.LOCAL,
                    new Date(),
                    Lib
                );
            });
            const rDisposer = reaction(
                () => excalidoc.data.elements,
                (elements) => {
                    const newVersion = Lib.getSceneVersion(elements);
                    if (newVersion === apiSceneVersion.current) {
                        return;
                    }
                    const restoredElements = Lib.restoreElements(
                        elements,
                        excalidrawAPI.getSceneElementsIncludingDeleted()
                    );
                    renderedSceneVersion.current = newVersion;
                    apiSceneVersion.current = newVersion;
                    excalidrawAPI.updateScene({
                        elements: restoredElements,
                        commitToHistory: true
                    });
                    excalidrawAPI.addFiles(Object.values(excalidoc.files));
                    excalidrawAPI.setToast({ message: 'Änderungen übernommen', duration: 2000 });
                }
            );
            initialized.current = true;
            return () => {
                initialized.current = false;
                onChangeDisposer();
                rDisposer();
            };
        }
    }, [excalidrawAPI, excalidoc]);
    if (!excalidoc || !Lib) {
        return null;
    }
    return (
        <Lib.Excalidraw
            initialData={{
                elements: [...excalidoc.elements],
                files: excalidoc.files,
                appState: {
                    objectsSnapModeEnabled: true,
                    zenModeEnabled: !props.libraryItems
                },
                scrollToContent: true,
                libraryItems: props.libraryItems
            }}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            objectsSnapModeEnabled
            langCode="de-DE"
            theme={colorMode === 'dark' ? 'dark' : 'light'}
            UIOptions={{
                canvasActions: { toggleTheme: false },
                tools: { image: !!props.allowImageInsertion }
            }}
            viewModeEnabled={props.readonly || !excalidoc.canEdit}
        >
            <Lib.MainMenu>
                <Lib.MainMenu.DefaultItems.Export />
                <Lib.MainMenu.DefaultItems.SaveAsImage />
                <Lib.MainMenu.DefaultItems.ChangeCanvasBackground />
                <Lib.MainMenu.DefaultItems.ClearCanvas />
                <Lib.MainMenu.DefaultItems.Help />
            </Lib.MainMenu>
        </Lib.Excalidraw>
    );
});

export default Editor;