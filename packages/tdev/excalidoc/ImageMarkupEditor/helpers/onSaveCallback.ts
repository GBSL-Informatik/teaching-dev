import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_EXPORT_QUALITY,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_MAX_EXPORT_WIDTH
} from './constants';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { getImageElementFromScene } from './getElementsFromScene';
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

const withoutMetaElements = (elements: readonly Ordered<NonDeletedExcalidrawElement>[]) => {
    return elements.filter((e) => e.id !== EXCALIDRAW_IMAGE_RECTANGLE_ID);
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
    const elementsWithoutMeta = withoutMetaElements(elements);
    const files = api.getFiles();

    return {
        scale: 1,
        mimeType: mimeType,
        asWebp: mimeType === 'image/webp',
        toExport: {
            elements: elementsWithoutMeta,
            files: files,
            exportPadding: 2,
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
