import { EXCALIDRAW_EXPORT_QUALITY } from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { EncodedImage } from './excalidrawScene';
import { loadSharp } from './optionalDependencies';

export type ImageFormat = 'webp' | 'png';

export const IMAGE_FORMATS: ImageFormat[] = ['webp', 'png'];

/** Encodes a PNG in the requested format, with the quality the markup editor exports with. */
export const encodeImage = async (png: Buffer, format: ImageFormat): Promise<EncodedImage> => {
    if (format === 'png') {
        return { data: png, mimeType: 'image/png', extension: '.png' };
    }
    const sharp = await loadSharp();
    const data = await sharp(png)
        .webp({ quality: EXCALIDRAW_EXPORT_QUALITY * 100 })
        .toBuffer();
    return { data, mimeType: 'image/webp', extension: '.webp' };
};
