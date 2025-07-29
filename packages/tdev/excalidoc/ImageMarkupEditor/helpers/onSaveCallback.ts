import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { EXCALIDRAW_BACKGROUND_FILE_ID, EXCALIDRAW_IMAGE_RECTANGLE_ID } from './constants';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
export type OnSave = (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;

const onSaveCallback = async (
    Lib: typeof ExcalidrawLib,
    callback?: OnSave,
    api?: ExcalidrawImperativeAPI | null,
    asWebp: boolean = false
) => {
    if (callback && api) {
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
        callback(
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
};

export default onSaveCallback;
