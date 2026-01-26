import React from 'react';
import { observer } from 'mobx-react-lite';
import type {
    ExcalidrawImperativeAPI,
    LibraryItems,
    NormalizedZoomValue
} from '@excalidraw/excalidraw/types';
import { Source } from '@tdev-models/iDocument';
import { reaction } from 'mobx';
import { useColorMode } from '@docusaurus/theme-common';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import _ from 'es-toolkit/compat';
import { useDocument } from '@tdev-hooks/useDocument';
import '@excalidraw/excalidraw/index.css';
import { MetaInit } from '@tdev/excalidoc/model/ModelMeta';
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
    const excalidoc = useDocument<'excalidoc'>(documentId);
    const renderedSceneVersion = React.useRef(0);
    const initialized = React.useRef<boolean>(false);
    const apiSceneVersion = React.useRef(0);
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI>();
    const { colorMode } = useColorMode();

    React.useEffect(() => {
        if (excalidrawAPI && excalidoc && !initialized.current) {
            excalidrawAPI.scrollToContent(excalidoc.elements, { fitToViewport: true });
            renderedSceneVersion.current = Lib.hashElementsVersion(excalidoc.elements);
            apiSceneVersion.current = renderedSceneVersion.current;
            const onChangeDisposer = excalidrawAPI.onChange((elements, appState, files) => {
                const version = Lib.hashElementsVersion(elements);
                if (version === renderedSceneVersion.current) {
                    return;
                }
                renderedSceneVersion.current = version;
                const nonDeletedElements = Lib.getNonDeletedElements(elements);
                apiSceneVersion.current = Lib.hashElementsVersion(nonDeletedElements);
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
                    const newVersion = Lib.hashElementsVersion(elements);
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
                        captureUpdate: Lib.CaptureUpdateAction.IMMEDIATELY
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

    if (!excalidoc || !Lib || !Lib.MainMenu) {
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
