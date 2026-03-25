import React from 'react';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import loadExcalidrawState from '../helpers/loadExcalidrawState';
import saveExcalidrawToFs from '../helpers/saveExcalidrawToFs';
import restoreExcalidrawFromFs from '../helpers/restoreExcalidrawFromFs';

const useExcalidrawSource = (root: FileSystemDirectoryHandle | null, src: string | null) => {
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);
    const loadIdRef = React.useRef(0);
    const { excaliName, excaliSrc, imgName, mimeType } = React.useMemo(
        () =>
            src
                ? extractExalidrawImageName(src)
                : { excaliName: '', excaliSrc: '', imgName: '', mimeType: '' },
        [src]
    );

    const load = React.useCallback(
        async (sourceOverride?: string) => {
            const target = sourceOverride ?? src;
            if (!root || !target) {
                return;
            }
            const id = ++loadIdRef.current;
            setExcaliState(null);
            try {
                const data = await loadExcalidrawState(root, target);
                if (id === loadIdRef.current) {
                    setExcaliState(data);
                }
            } catch (error) {
                if (id === loadIdRef.current) {
                    console.error('Error processing image:', error);
                    window.alert(`Error processing image: ${error}`);
                }
            }
        },
        [root, src]
    );

    const save = React.useCallback(
        async (state: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => {
            if (!root || !src) {
                return;
            }
            return saveExcalidrawToFs(root, src, excaliSrc, imgName, state, blob, asWebp);
        },
        [root, src, excaliSrc, imgName]
    );

    const restore = React.useCallback(async () => {
        if (!root) {
            return false;
        }
        return restoreExcalidrawFromFs(root, excaliSrc, excaliName, imgName);
    }, [root, excaliSrc, excaliName, imgName]);

    return {
        excaliState,
        setExcaliState,
        excaliName,
        excaliSrc,
        imgName,
        mimeType,
        load,
        save,
        restore
    };
};

export default useExcalidrawSource;
