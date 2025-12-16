import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
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
import { getCustomProps } from './customProps';
export type OnSave = (data: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => void;

const withBackgroundImage = (
    imageElement: ExcalidrawImageElement,
    elements: readonly Ordered<NonDeletedExcalidrawElement>[],
    api: ExcalidrawImperativeAPI,
    asWebp: boolean = false
) => {
    const elementsWithoutMeta = withoutMetaElements(elements);
    const exportAsWebp = asWebp || imageElement.customData?.exportFormatMimeType === 'image/webp';
    const exportProps = getCustomProps(imageElement);

    if (asWebp) {
        if (!('customData' in imageElement)) {
            (imageElement as any).customData = {};
        }
        imageElement.customData!.exportFormatMimeType = 'image/webp';
    }
    const files = api.getFiles();
    const initMimeType = files[EXCALIDRAW_BACKGROUND_FILE_ID]?.mimeType;

    return {
        scale: exportProps.scale,
        mimeType: initMimeType,
        asWebp: exportAsWebp,
        toExport: {
            elements: elementsWithoutMeta,
            files: files,
            exportPadding: exportProps.exportPadding,
            quality: exportProps.quality,
            appState: {
                exportBackground: exportProps.exportBackground,
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
    const metaElement = elements.find((e) => e.id === EXCALIDRAW_STANDALONE_DRAWING_ID);
    const elementsWithoutMeta = withoutMetaElements(elements);
    const files = api.getFiles();
    const exportProps = getCustomProps(metaElement);
    return {
        scale: exportProps.scale,
        mimeType: mimeType,
        asWebp: exportProps.exportFormatMimeType === 'image/webp',
        toExport: {
            elements: elementsWithoutMeta,
            files: files,
            exportPadding: exportProps.exportPadding,
            quality: exportProps.quality,
            appState: {
                exportBackground: exportProps.exportBackground,
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
