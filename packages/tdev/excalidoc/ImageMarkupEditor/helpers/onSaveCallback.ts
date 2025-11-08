import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_EXPORT_QUALITY,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_MAX_EXPORT_WIDTH,
    EXCALIDRAW_STANDALONE_DRAWING_ID
} from './constants';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { getImageElementFromScene, withoutMetaElements } from './getElementsFromScene';
import type {
    ExcalidrawImageElement,
    NonDeletedExcalidrawElement,
    Ordered
} from '@excalidraw/excalidraw/element/types';
export type OnSave = (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;

const getScale = (imgWidth: number, scaleFactor?: number) => {
    const initScale = 1 / (scaleFactor || 1);
    const width = imgWidth * initScale;
    const scale =
        width < EXCALIDRAW_MAX_EXPORT_WIDTH ? initScale : initScale * (EXCALIDRAW_MAX_EXPORT_WIDTH / width);
    return scale;
};

const withBackgroundImage = (
    imageElement: ExcalidrawImageElement,
    elements: readonly Ordered<NonDeletedExcalidrawElement>[],
    api: ExcalidrawImperativeAPI,
    asWebp: boolean = false
) => {
    const elementsWithoutMeta = withoutMetaElements(elements);
    const exportAsWebp = asWebp || imageElement.customData?.exportFormatMimeType === 'image/webp';

    if (asWebp) {
        if (!('customData' in imageElement)) {
            (imageElement as any).customData = {};
        }
        imageElement.customData!.exportFormatMimeType = 'image/webp';
    }
    const files = api.getFiles();
    const initMimeType = files[EXCALIDRAW_BACKGROUND_FILE_ID]?.mimeType;

    return {
        scale: getScale(imageElement.width, imageElement.customData?.scale),
        mimeType: initMimeType,
        asWebp: exportAsWebp,
        toExport: {
            elements: elementsWithoutMeta,
            files: files,
            exportPadding: 0,
            appState: {
                exportBackground: false,
                exportEmbedScene: false
            }
        }
    };
};

const plainExcalidrawImage = (
    elements: readonly Ordered<NonDeletedExcalidrawElement>[],
    api: ExcalidrawImperativeAPI,
    mimeType: string
) => {
    const isStandaloneDrawing = elements.some((e) => e.id === EXCALIDRAW_STANDALONE_DRAWING_ID);
    const elementsWithoutMeta = withoutMetaElements(elements);
    const minX = Math.min(...elementsWithoutMeta.map((e) => e.x));
    const maxX = Math.max(...elementsWithoutMeta.map((e) => e.x + e.width));
    const dX = Math.max(maxX - minX, 1);
    const files = api.getFiles();
    const padding = Math.max(
        ...elementsWithoutMeta.map((e) => (e.type === 'freedraw' ? e.strokeWidth : e.strokeWidth)),
        2
    );
    const scale = isStandaloneDrawing ? (dX < 50 ? 15 : dX < 100 ? 8 : dX < 200 ? 4 : dX < 400 ? 3 : 1) : 1;
    return {
        scale: scale,
        mimeType: mimeType,
        asWebp: mimeType === 'image/webp',
        toExport: {
            elements: elementsWithoutMeta,
            files: files,
            exportPadding: padding,
            appState: {
                exportBackground: false,
                exportEmbedScene: false
            }
        }
    };
};

const onSaveCallback = async (
    Lib: typeof ExcalidrawLib,
    mimeType: string,
    callback?: OnSave,
    api?: ExcalidrawImperativeAPI | null,
    asWebp: boolean = false
) => {
    if (callback && api) {
        const elements = api.getSceneElements();
        const [imageElement] = getImageElementFromScene(elements);
        const setup = imageElement
            ? withBackgroundImage(imageElement, elements, api, asWebp)
            : plainExcalidrawImage(elements, api, mimeType);
        const data =
            setup.mimeType === 'image/svg+xml' && !setup.asWebp
                ? await Lib.exportToSvg({
                      ...setup.toExport,
                      type: 'svg',
                      mimeType: setup.mimeType
                  }).then((svg: SVGElement) => {
                      const serializer = new XMLSerializer();
                      return new Blob([serializer.serializeToString(svg)], { type: setup.mimeType });
                  })
                : ((await Lib.exportToBlob({
                      ...setup.toExport,
                      getDimensions: (width: number, height: number) => {
                          return {
                              width: width * setup.scale,
                              height: height * setup.scale,
                              scale: setup.scale
                          };
                      },
                      quality: EXCALIDRAW_EXPORT_QUALITY,
                      mimeType: setup.asWebp ? 'image/webp' : setup.mimeType
                  })) as Blob);
        callback(
            {
                type: 'excalidraw',
                version: 2,
                elements: elements,
                files: setup.toExport.files
            },
            data,
            asWebp || setup.asWebp
        );
    }
};

export default onSaveCallback;
