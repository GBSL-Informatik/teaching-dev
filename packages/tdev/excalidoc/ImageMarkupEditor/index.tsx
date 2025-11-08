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
import _ from 'es-toolkit/compat';
import { EXCALIDRAW_RED } from './helpers/constants';
import onSaveCallback, { OnSave } from './helpers/onSaveCallback';
import { getSelectedStrokeElements } from './helpers/getSelectedStrokeElements';
import getSelectedTextElementId from './helpers/getSelectedTextElementId';
import TopRightUi from './TopRightUi';
import MainMenu from './MainMenu';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import { getImageElementFromScene } from './helpers/getElementsFromScene';
import { ExcalidrawFreeDrawElement } from '@excalidraw/excalidraw/element/types';

interface Props {
    mimeType: string;
    initialData?: ExcalidrawInitialDataState | null;
    onSave?: OnSave;
    onDiscard?: () => void;
    onRestore?: () => void;
}

const getFreedrawPressureState = (freedrawElements: ExcalidrawFreeDrawElement[]) => {
    return freedrawElements.length === 0
        ? null
        : freedrawElements.every((e) => e.simulatePressure || e.pressures.length > 0)
          ? 'on'
          : freedrawElements.some((e) => e.simulatePressure || e.pressures.length > 0)
            ? 'partial'
            : 'off';
};

const ImageMarkupEditor = observer((props: Props) => {
    const hasImageElement = React.useMemo(() => {
        return !!(props.initialData?.elements && getImageElementFromScene(props.initialData.elements)[0]);
    }, [props.initialData]);
    const Lib = useClientLib<typeof ExcalidrawLib>(
        () => import('@excalidraw/excalidraw'),
        '@excalidraw/excalidraw'
    );
    if (!Lib) {
        return <Loader />;
    }
    return <Editor {...props} Lib={Lib} hasBGImage={hasImageElement} />;
});

const Editor = observer((props: Props & { hasBGImage: boolean; Lib: typeof ExcalidrawLib }) => {
    const { Lib, mimeType } = props;
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI | null>(null);
    const [renderKey, setRenderKey] = React.useState(1);
    const initialized = React.useRef<boolean>(false);
    const currentState = React.useRef<ExcalidrawInitialDataState | null>(props.initialData || null);
    const [hasChanges, setHasChanges] = React.useState(false);
    const [showLineActions, setShowLineActions] = React.useState(false);
    const [selectedTextId, setSelectedTextId] = React.useState<string | null>(null);
    const [freedrawState, setFreedrawState] = React.useState<'off' | 'partial' | 'on' | null>(null);

    const { colorMode } = useColorMode();
    React.useEffect(() => {
        if (excalidrawAPI && !initialized.current) {
            excalidrawAPI.registerAction({
                name: 'saveToActiveFile',
                label: 'buttons.save',
                perform: (elements, appState, formData, app) => {
                    onSaveCallback(Lib, mimeType, props.onSave, excalidrawAPI, false);
                    return {
                        captureUpdate: Lib.CaptureUpdateAction.IMMEDIATELY
                    };
                },
                trackEvent: { category: 'export' },
                keyTest: (event) => event.key === 's' && (event.ctrlKey || event.metaKey) && !event.shiftKey
            });
            let hasElements = excalidrawAPI.getSceneElements().length > 0;
            let hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());

            const onUpdateDisposer = excalidrawAPI.onChange(() => {
                if (!hasElements) {
                    hasElements = excalidrawAPI.getSceneElements().length > 0;
                    hash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                    return;
                }
                setSelectedTextId(getSelectedTextElementId(excalidrawAPI));
                const strokeElements = getSelectedStrokeElements(excalidrawAPI);
                setShowLineActions(strokeElements.length > 0);
                const freedrawElements = strokeElements.filter((e) => e.type === 'freedraw');
                setFreedrawState(getFreedrawPressureState(freedrawElements));
                const eHash = Lib.hashElementsVersion(excalidrawAPI.getSceneElements());
                setHasChanges(hash !== eHash);
            });
            initialized.current = true;
            return () => {
                initialized.current = false;
                onUpdateDisposer();
            };
        }
    }, [excalidrawAPI, props.onSave, Lib]);

    React.useEffect(() => {
        if (excalidrawAPI) {
            scheduleMicrotask(() => {
                excalidrawAPI.scrollToContent(undefined, { fitToViewport: true, animate: false });
            });
        }
    }, [excalidrawAPI]);

    const updateScene = React.useCallback((appState: ExcalidrawInitialDataState) => {
        currentState.current!.elements = appState.elements;
        currentState.current!.files = appState.files;
        setRenderKey((prev) => prev + 1);
    }, []);

    const onSave = React.useCallback(
        () => onSaveCallback(Lib, mimeType, props.onSave, excalidrawAPI!, false),
        [mimeType, Lib, props.onSave, excalidrawAPI]
    );
    if (!Lib || !Lib.MainMenu) {
        return <Loader label="Initialize Excalidraw..." />;
    }
    return (
        <Lib.Excalidraw
            key={renderKey}
            initialData={{
                elements: currentState.current?.elements || [],
                files: currentState.current?.files || {},
                appState: {
                    objectsSnapModeEnabled: true,
                    zoom: {
                        value: 0.8 as NormalizedZoomValue // 80 %
                    },
                    currentItemEndArrowhead: 'triangle',
                    currentItemStrokeColor: EXCALIDRAW_RED,
                    currentItemStrokeWidth: 4,
                    currentItemRoughness: 0,
                    currentItemBackgroundColor: 'transparent'
                },
                scrollToContent: true
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
                    <TopRightUi
                        hasChanges={hasChanges}
                        freedrawState={freedrawState}
                        showLineActions={showLineActions}
                        selectedTextId={selectedTextId}
                        api={excalidrawAPI!}
                        restoreFn={Lib.restoreElements}
                        onSave={onSave}
                        updateScene={updateScene}
                        hasBGImage={props.hasBGImage}
                    />
                );
            }}
        >
            <MainMenu
                Lib={Lib}
                api={excalidrawAPI!}
                onSave={props.onSave}
                onRestore={props.onRestore}
                mimeType={mimeType}
                hasChanges={hasChanges}
                hasBGImage={props.hasBGImage}
            />
        </Lib.Excalidraw>
    );
});

export default ImageMarkupEditor;
