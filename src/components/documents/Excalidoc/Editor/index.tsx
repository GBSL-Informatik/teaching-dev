import React from 'react';
import { observer } from 'mobx-react-lite';
import { MetaInit, ModelMeta } from '@site/src/models/documents/Excalidoc';
import type {
    ExcalidrawImperativeAPI,
    LibraryItems,
    NormalizedZoomValue
} from '@excalidraw/excalidraw/types/types';
import { Source } from '@tdev-models/iDocument';
import { reaction } from 'mobx';
import { useColorMode } from '@docusaurus/theme-common';
import type { default as ExcalidrawLib } from '@excalidraw/excalidraw';
import _ from 'lodash';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { useDocument } from '@tdev-hooks/useDocument';
import { DocumentType } from '@tdev-api/document';

export interface Props extends MetaInit {
    Lib: typeof ExcalidrawLib;
    documentId: string;
    libraryItems?: LibraryItems;
    allowImageInsertion?: boolean;
    readonly?: boolean;
    onlyCommitValidChanges?: boolean;
    zenMode?: boolean;
}

const Editor = observer((props: Props) => {
    const { Lib, documentId } = props;
    const excalidoc = useDocument<DocumentType.Excalidoc>(documentId);
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
                    if (props.onlyCommitValidChanges && restoredElements.length !== elements.length) {
                        excalidrawAPI.setToast({ message: 'Invalide Elemente gefunden', duration: 2000 });
                        return;
                    }
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

    /**
     * ensure that excalidraw has a correct offset and scroll position
     * for cursors.
     * Reading the docs, this should not be needed: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api#refresh
     * But somehow, this bug's for the viewMode...
     */
    React.useEffect(() => {
        const onscroll = _.debounce(() => {
            if (excalidrawAPI) {
                excalidrawAPI.refresh();
            }
        }, 50);
        document.addEventListener('scroll', onscroll);
        return () => {
            onscroll.cancel();
            document.removeEventListener('scroll', onscroll);
        };
    }, [excalidrawAPI]);

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
                    zenModeEnabled: props.zenMode ?? !props.libraryItems,
                    zoom: {
                        value: 1.0 as NormalizedZoomValue // 100 %
                    }
                },
                scrollToContent: true,
                libraryItems: props.libraryItems
            }}
            objectsSnapModeEnabled
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
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
