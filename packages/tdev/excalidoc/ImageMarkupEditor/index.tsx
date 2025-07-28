import React from 'react';
import { observer } from 'mobx-react-lite';
import { useClientLib } from '@tdev-hooks/useClientLib';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import Loader from '@tdev-components/Loader';
import type {
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState,
    NormalizedZoomValue
} from '@excalidraw/excalidraw/types';
import { useColorMode } from '@docusaurus/theme-common';
import _ from 'lodash';
import { mdiContentSave, mdiImageMove, mdiRestoreAlert } from '@mdi/js';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID
} from './EditorPopup/createExcalidrawMarkup';
import Icon from '@mdi/react';

interface Props {
    initialData?: ExcalidrawInitialDataState | null;
    onSave?: (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;
    onDiscard?: () => void;
    onRestore?: () => void;
}

const ImageMarkupEditor = observer((props: Props) => {
    const Lib = useClientLib<typeof ExcalidrawLib>(
        () => import('@excalidraw/excalidraw'),
        '@excalidraw/excalidraw'
    );
    if (!Lib) {
        return <Loader />;
    }
    return <Editor {...props} Lib={Lib} />;
});

const Editor = observer((props: Props & { Lib: typeof ExcalidrawLib }) => {
    const { Lib } = props;
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI | null>(null);
    const initialized = React.useRef<boolean>(false);
    const [hasChanges, setHasChanges] = React.useState(false);

    const { colorMode } = useColorMode();
    const onSave = React.useCallback(
        async (api?: ExcalidrawImperativeAPI | null, asWebp: boolean = false) => {
            if (props.onSave && api) {
                const elements = api.getSceneElements();
                const metaRectangleElement = elements.find((e) => e.id === EXCALIDRAW_IMAGE_RECTANGLE_ID);
                const elementsWithoutMeta = elements.filter((e) => e.id !== EXCALIDRAW_IMAGE_RECTANGLE_ID);
                const exportAsWebp = asWebp || metaRectangleElement?.customData?.exportFormat === 'webp';

                if (asWebp && metaRectangleElement) {
                    if (!('customData' in metaRectangleElement)) {
                        (metaRectangleElement as any).customData = {};
                    }
                    metaRectangleElement.customData!.exportFormat = 'webp';
                }
                const files = api.getFiles();
                const initMimeType = files[EXCALIDRAW_BACKGROUND_FILE_ID].mimeType;

                const toExport = {
                    elements: elementsWithoutMeta,
                    files: files,
                    exportPadding: 0,
                    appState: {
                        exportBackground: false,
                        exportEmbedScene: false
                    }
                };
                const data =
                    initMimeType === 'image/svg+xml' && !exportAsWebp
                        ? await Lib.exportToSvg({
                              ...toExport,
                              type: 'svg',
                              mimeType: initMimeType
                          }).then((svg: SVGElement) => {
                              const serializer = new XMLSerializer();
                              return new Blob([serializer.serializeToString(svg)], { type: initMimeType });
                          })
                        : ((await Lib.exportToBlob({
                              ...toExport,
                              getDimensions: (width: number, height: number) => ({
                                  width: width,
                                  height: height,
                                  scale: 1
                              }),
                              mimeType: exportAsWebp ? 'image/webp' : initMimeType
                          })) as Blob);
                props.onSave(
                    {
                        type: 'excalidraw',
                        version: 2,
                        elements: elements,
                        files: files
                    },
                    data,
                    exportAsWebp
                );
            }
        },
        [props.onSave]
    );
    React.useEffect(() => {
        if (excalidrawAPI && !initialized.current) {
            if (props.initialData?.elements) {
                excalidrawAPI.scrollToContent(undefined, { fitToViewport: true });
            }
            excalidrawAPI.registerAction({
                name: 'saveToActiveFile',
                label: 'buttons.save',
                perform: (elements, appState, formData, app) => {
                    onSave(excalidrawAPI);
                    return {
                        captureUpdate: Lib.CaptureUpdateAction.IMMEDIATELY
                    };
                },
                trackEvent: { category: 'export' },
                keyTest: (event) => event.key === 's' && (event.ctrlKey || event.metaKey) && !event.shiftKey
            });
            let hasElements = excalidrawAPI.getSceneElements().length > 0;
            let hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
            const onUnsubscribe = excalidrawAPI.onChange(() => {
                if (!hasElements) {
                    hasElements = excalidrawAPI.getSceneElements().length > 0;
                    hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                    return;
                }
                const eHash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                setHasChanges(hash !== eHash);
            });
            initialized.current = true;
            return () => {
                initialized.current = false;
                onUnsubscribe();
            };
        }
    }, [excalidrawAPI, onSave]);

    if (!Lib || !Lib.MainMenu) {
        return <Loader label="Initialize Excalidraw..." />;
    }
    return (
        <Lib.Excalidraw
            initialData={{
                elements: props.initialData?.elements || [],
                files: props.initialData?.files || {},
                appState: {
                    objectsSnapModeEnabled: true,
                    zoom: {
                        value: 1.0 as NormalizedZoomValue // 100 %
                    }
                },
                scrollToContent: true,
                libraryItems: props.initialData?.libraryItems || []
            }}
            objectsSnapModeEnabled
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            langCode="de-DE"
            theme={colorMode === 'dark' ? 'dark' : 'light'}
            UIOptions={{
                canvasActions: { toggleTheme: false },
                tools: { image: true }
            }}
            autoFocus
        >
            <Lib.MainMenu>
                {hasChanges && (
                    <Lib.MainMenu.Item
                        onSelect={() => onSave(excalidrawAPI)}
                        shortcut="Ctrl+S"
                        icon={<Icon path={mdiContentSave} size={0.7} color="var(--ifm-color-success)" />}
                    >
                        Speichern
                    </Lib.MainMenu.Item>
                )}
                <Lib.MainMenu.DefaultItems.Export />
                <Lib.MainMenu.DefaultItems.SaveAsImage />
                <Lib.MainMenu.Item
                    onSelect={() => onSave(excalidrawAPI, true)}
                    icon={<Icon path={mdiImageMove} size={0.7} />}
                    title="Achtung, die referenzierenden Markdown-Dateien müssen manuell angepasst werden!"
                >
                    Als WebP speichern
                </Lib.MainMenu.Item>
                {props.onRestore && (
                    <Lib.MainMenu.Item
                        onSelect={() => props.onRestore!()}
                        icon={<Icon path={mdiRestoreAlert} size={0.7} color="var(--ifm-color-danger)" />}
                        title="Achtung! Alle Änderungen gehen verloren!"
                    >
                        Original Wiederherstellen
                    </Lib.MainMenu.Item>
                )}
            </Lib.MainMenu>
        </Lib.Excalidraw>
    );
});

export default ImageMarkupEditor;
