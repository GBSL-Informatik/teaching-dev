import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { EXCALIDRAW_EXPORT_QUALITY, EXCALIDRAW_MAX_EXPORT_WIDTH } from './constants';
import { getBoundingRect } from './getBoundingRect';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { getMetaElementFromScene } from './getElementsFromScene';
import updateElementsWith from './updateElementsWith';

export interface CustomProps {
    exportBackground: boolean;
    exportPadding: number;
    scale: number;
    quality: number;
    exportFormatMimeType?: 'image/webp' | string;
}

type NullableCustomProps = { [key in keyof CustomProps]: null };

export const getScale = (width: number, height: number) => {
    if (width > EXCALIDRAW_MAX_EXPORT_WIDTH) {
        return Math.round((EXCALIDRAW_MAX_EXPORT_WIDTH / width) * 100) / 100;
    }
    const size = Math.max(width, height, 1);
    if (size < 50) {
        return 20;
    }
    if (size < 100) {
        return 15;
    }
    if (size < 200) {
        return 8;
    }
    if (size < 400) {
        return 4;
    }
    if (size < 600) {
        return 3;
    }
    if (size < 800) {
        return 2;
    }
    if (size < 1200) {
        return 1.5;
    }
    if (size < 1600) {
        return 1.2;
    }
    return 1;
};

export const getCustomProps = (metaElement?: ExcalidrawElement): CustomProps => {
    const elementData: Partial<CustomProps> = metaElement?.customData ?? {};
    const bbox = metaElement ? getBoundingRect([metaElement]) : { width: 100, height: 100 };
    const props: CustomProps = {
        exportBackground: elementData.exportBackground ?? false,
        exportPadding: elementData.exportPadding ?? 0,
        scale: elementData.scale ?? getScale(bbox.width, bbox.height),
        quality: elementData.quality ?? EXCALIDRAW_EXPORT_QUALITY
    };
    if (elementData.exportFormatMimeType) {
        props.exportFormatMimeType = elementData.exportFormatMimeType;
    }
    return props;
};

const DEFAULT_KEYS = new Set<string>([...Object.keys(getCustomProps()), 'exportFormatMimeType']);
const DEFAULT = getCustomProps();

export const updateCustomProps = (
    api: ExcalidrawImperativeAPI,
    props: Partial<CustomProps | NullableCustomProps>
) => {
    const elements = api.getSceneElementsIncludingDeleted();
    const meta = getMetaElementFromScene(elements);
    if (!meta) {
        return;
    }
    const customProps: Partial<CustomProps> = { ...(meta.customData ?? {}) };
    Object.entries(props).forEach(([key, value]) => {
        if (
            value === null ||
            value === undefined ||
            !DEFAULT_KEYS.has(key) ||
            value === DEFAULT[key as keyof CustomProps]
        ) {
            delete customProps[key as keyof CustomProps];
        } else {
            customProps[key as keyof CustomProps] = value as any;
        }
    });
    Object.keys(customProps).forEach((key) => {
        if (!(key in props)) {
            delete customProps[key as keyof CustomProps];
        }
    });
    return updateElementsWith<ExcalidrawElement>(api, [meta], (e) => {
        const updated: ExcalidrawElement = { ...e, customData: customProps };
        if (Object.keys(customProps).length === 0) {
            delete (updated as any).customData;
        }
        return updated;
    });
};
