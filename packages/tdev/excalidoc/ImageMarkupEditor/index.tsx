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
import {
    mdiContentSave,
    mdiFormatColorText,
    mdiFormatFontSizeDecrease,
    mdiFormatFontSizeIncrease,
    mdiImageMove,
    mdiMinus,
    mdiPlus,
    mdiRestoreAlert
} from '@mdi/js';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_RED,
    EXCALIDRAW_STROKE_TYPES
} from './EditorPopup/createExcalidrawMarkup';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import styles from './styles.module.scss';
import clsx from 'clsx';
import onSaveCallback from './onSaveCallback';
import { ExcalidrawElement, ExcalidrawTextElement } from '@excalidraw/excalidraw/element/types';

export type OnSave = (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;

interface Props {
    initialData?: ExcalidrawInitialDataState | null;
    onSave?: OnSave;
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

const getSelectedStrokeElements = (api: ExcalidrawImperativeAPI): ExcalidrawElement[] => {
    const selectedIds = new Set(Object.keys(api.getAppState().selectedElementIds));
    if (selectedIds.size > 0) {
        const selectedElements = api.getSceneElements().filter((e) => selectedIds.has(e.id));
        const hasStrokeWidth = selectedElements.every((e) => EXCALIDRAW_STROKE_TYPES.has(e.type));
        if (hasStrokeWidth) {
            return selectedElements;
        }
    }
    return [];
};

const getSelectedTextElementId = (api: ExcalidrawImperativeAPI): string | null => {
    const selectedIds = new Set(Object.keys(api.getAppState().selectedElementIds));
    if (selectedIds.size > 0) {
        const elements = api.getSceneElements();
        const selectedElements = elements.filter((e) => selectedIds.has(e.id));
        const textIds = selectedElements
            .filter((e) => e.type === 'text' || e.boundElements?.some((be) => be.type === 'text'))
            .map((e) => (e.type === 'text' ? e.id : e.boundElements!.find((be) => be.type === 'text')!.id));
        if (textIds.length === 1) {
            return textIds[0];
        }
    }
    return null;
};

const updateWith = (
    api: ExcalidrawImperativeAPI,
    toUpdate: { id: string }[],
    updateFn: (e: ExcalidrawElement) => ExcalidrawElement
) => {
    const elements = api.getSceneElementsIncludingDeleted();
    return api.updateScene({
        elements: elements.map((e) => {
            if (toUpdate.some((u) => u.id === e.id)) {
                // invalidate versionNonce to put it to the history
                return { ...updateFn(e), versionNonce: e.versionNonce + 1 };
            }
            return e;
        }),
        captureUpdate: 'IMMEDIATELY'
    });
};
const restoreWith = (
    restoreFn: typeof ExcalidrawLib.restoreElements,
    api: ExcalidrawImperativeAPI,
    toUpdate: { id: string }[],
    updateFn: (e: ExcalidrawElement) => ExcalidrawElement
) => {
    const all = api.getSceneElementsIncludingDeleted();
    const elements = all.map((e) => {
        if (toUpdate.some((u) => u.id === e.id)) {
            return { ...updateFn(e), versionNonce: e.versionNonce + 1 };
        }
        return e;
    });
    return api.updateScene({
        elements: restoreFn(elements, all, { refreshDimensions: true, repairBindings: true }),
        captureUpdate: 'IMMEDIATELY'
    });
};

const Editor = observer((props: Props & { Lib: typeof ExcalidrawLib }) => {
    const { Lib } = props;
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI | null>(null);
    const initialized = React.useRef<boolean>(false);
    const [hasChanges, setHasChanges] = React.useState(false);
    const [showLineActions, setShowLineActions] = React.useState(false);
    const [selectedTextId, setSelectedTextId] = React.useState<string | null>(null);

    const { colorMode } = useColorMode();
    React.useEffect(() => {
        if (excalidrawAPI && !initialized.current) {
            if (props.initialData?.elements) {
                excalidrawAPI.scrollToContent(undefined, { fitToViewport: true });
            }
            excalidrawAPI.registerAction({
                name: 'saveToActiveFile',
                label: 'buttons.save',
                perform: (elements, appState, formData, app) => {
                    onSaveCallback(Lib, props.onSave, excalidrawAPI, false);
                    return {
                        captureUpdate: Lib.CaptureUpdateAction.IMMEDIATELY
                    };
                },
                trackEvent: { category: 'export' },
                keyTest: (event) => event.key === 's' && (event.ctrlKey || event.metaKey) && !event.shiftKey
            });
            let hasElements = excalidrawAPI.getSceneElements().length > 0;
            let hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());

            const onUpdate = excalidrawAPI.onChange(() => {
                if (!hasElements) {
                    hasElements = excalidrawAPI.getSceneElements().length > 0;
                    hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                    return;
                }
                setSelectedTextId(getSelectedTextElementId(excalidrawAPI));
                setShowLineActions(getSelectedStrokeElements(excalidrawAPI).length > 0);
                const eHash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                setHasChanges(hash !== eHash);
            });
            initialized.current = true;
            return () => {
                initialized.current = false;
                onUpdate();
            };
        }
    }, [excalidrawAPI, props.onSave, Lib]);

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
                    },
                    currentItemEndArrowhead: 'triangle',
                    currentItemStrokeColor: EXCALIDRAW_RED,
                    currentItemStrokeWidth: 8,
                    currentItemRoughness: 0,
                    currentItemBackgroundColor: 'transparent'
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
            renderTopRightUI={() => {
                return (
                    <div className={clsx(styles.topRightUI)}>
                        {hasChanges && (
                            <Button
                                icon={mdiContentSave}
                                color="green"
                                title="Speichern und schliessen"
                                onClick={() => {
                                    onSaveCallback(Lib, props.onSave, excalidrawAPI, false);
                                }}
                            />
                        )}
                        {showLineActions && excalidrawAPI && (
                            <div className={styles.lineActions}>
                                <Button
                                    icon={mdiMinus}
                                    onClick={() => {
                                        const selectedStrokes = getSelectedStrokeElements(excalidrawAPI);
                                        if (selectedStrokes.length > 0) {
                                            updateWith(excalidrawAPI, selectedStrokes, (e) => ({
                                                ...e,
                                                strokeWidth: Math.max(1, e.strokeWidth - 2)
                                            }));
                                        }
                                    }}
                                />
                                <Button
                                    icon={mdiPlus}
                                    onClick={() => {
                                        const selectedStrokes = getSelectedStrokeElements(excalidrawAPI);
                                        if (selectedStrokes.length > 0) {
                                            updateWith(excalidrawAPI, selectedStrokes, (e) => ({
                                                ...e,
                                                strokeWidth: e.strokeWidth + 2
                                            }));
                                        }
                                    }}
                                />
                            </div>
                        )}
                        {selectedTextId && excalidrawAPI && (
                            <div className={styles.lineActions}>
                                <Button
                                    icon={mdiFormatFontSizeDecrease}
                                    onClick={(e) => {
                                        restoreWith(
                                            Lib.restoreElements,
                                            excalidrawAPI,
                                            [{ id: selectedTextId }],
                                            (e) => ({
                                                ...e,
                                                fontSize: (e as ExcalidrawTextElement).fontSize / 1.2
                                            })
                                        );
                                        excalidrawAPI.refresh();
                                    }}
                                />
                                <Button
                                    icon={mdiFormatFontSizeIncrease}
                                    onClick={(e) => {
                                        restoreWith(
                                            Lib.restoreElements,
                                            excalidrawAPI,
                                            [{ id: selectedTextId }],
                                            (e) => ({
                                                ...e,
                                                fontSize: (e as ExcalidrawTextElement).fontSize * 1.2
                                            })
                                        );
                                        excalidrawAPI.refresh();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            }}
        >
            <Lib.MainMenu>
                {hasChanges && (
                    <Lib.MainMenu.Item
                        onSelect={() => onSaveCallback(Lib, props.onSave, excalidrawAPI, false)}
                        shortcut="Ctrl+S"
                        icon={<Icon path={mdiContentSave} size={0.7} color="var(--ifm-color-success)" />}
                    >
                        Speichern
                    </Lib.MainMenu.Item>
                )}
                <Lib.MainMenu.DefaultItems.Export />
                <Lib.MainMenu.DefaultItems.SaveAsImage />
                <Lib.MainMenu.Item
                    onSelect={() => onSaveCallback(Lib, props.onSave, excalidrawAPI, true)}
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
