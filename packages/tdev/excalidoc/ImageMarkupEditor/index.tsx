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
import { EXCALIDRAW_RED } from './helpers/constants';
import onSaveCallback, { OnSave } from './helpers/onSaveCallback';
import { getSelectedStrokeElements } from './helpers/getSelectedStrokeElements';
import getSelectedTextElementId from './helpers/getSelectedTextElementId';
import TopRightUi from './TopRightUi';
import MainMenu from './MainMenu';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

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

const Editor = observer((props: Props & { Lib: typeof ExcalidrawLib }) => {
    const { Lib } = props;
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<ExcalidrawImperativeAPI | null>(null);
    const [renderKey, setRenderKey] = React.useState(1);
    const initialized = React.useRef<boolean>(false);
    const currentState = React.useRef<ExcalidrawInitialDataState | null>(props.initialData || null);
    const [hasChanges, setHasChanges] = React.useState(false);
    const [showLineActions, setShowLineActions] = React.useState(false);
    const [selectedTextId, setSelectedTextId] = React.useState<string | null>(null);

    const { colorMode } = useColorMode();
    React.useEffect(() => {
        if (excalidrawAPI && !initialized.current) {
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

            const onUpdateDisposer = excalidrawAPI.onChange(() => {
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
                        value: 1.0 as NormalizedZoomValue // 100 %
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
                        showLineActions={showLineActions}
                        selectedTextId={selectedTextId}
                        api={excalidrawAPI!}
                        onSave={() => onSaveCallback(Lib, props.onSave, excalidrawAPI!, false)}
                        restoreFn={Lib.restoreElements}
                        updateScene={(appState) => {
                            currentState.current!.elements = appState.elements;
                            currentState.current!.files = appState.files;
                            setRenderKey((prev) => prev + 1);
                        }}
                    />
                );
            }}
        >
            <MainMenu
                Lib={Lib}
                api={excalidrawAPI!}
                onSave={props.onSave}
                onRestore={props.onRestore}
                hasChanges={hasChanges}
            />
        </Lib.Excalidraw>
    );
});

export default ImageMarkupEditor;
