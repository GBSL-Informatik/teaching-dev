import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_EXPORT_QUALITY,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_MAX_EXPORT_WIDTH
} from './constants';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { getImageElementFromScene } from './getElementsFromScene';
export type OnSave = (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;

const getScale = (imgWidth: number, scaleFactor?: number) => {
    const initScale = 1 / (scaleFactor || 1);
    const width = imgWidth * initScale;
    const scale =
        width < EXCALIDRAW_MAX_EXPORT_WIDTH ? initScale : initScale * (EXCALIDRAW_MAX_EXPORT_WIDTH / width);
    return scale;
};

const onSaveCallback = async (
    Lib: typeof ExcalidrawLib,
    callback?: OnSave,
    api?: ExcalidrawImperativeAPI | null,
    asWebp: boolean = false
) => {
    if (callback && api) {
        const elements = api.getSceneElements();
        const [imageElement] = getImageElementFromScene(elements);
        if (!imageElement) {
            return;
        }
        const elementsWithoutMeta = elements.filter((e) => e.id !== EXCALIDRAW_IMAGE_RECTANGLE_ID);
        const exportAsWebp = asWebp || imageElement?.customData?.exportFormatMimeType === 'image/webp';

        if (asWebp) {
            if (!('customData' in imageElement)) {
                (imageElement as any).customData = {};
            }
            imageElement.customData!.exportFormatMimeType = 'image/webp';
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
        const scale = getScale(imageElement.width, imageElement.customData?.scale);

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
                      getDimensions: (width: number, height: number) => {
                          return {
                              width: width * scale,
                              height: height * scale,
                              scale: scale
                          };
                      },
                      quality: EXCALIDRAW_EXPORT_QUALITY,
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
