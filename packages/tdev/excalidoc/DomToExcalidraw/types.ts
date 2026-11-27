import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export type Skeleton = ExcalidrawElementSkeleton;

export interface Scene {
    elements: Skeleton[];
    files: BinaryFiles;
}

/**
 * Font family ids of Excalidraw, see `FONT_FAMILY` in `@excalidraw/excalidraw`.
 * Repeated here, so that copying does not load the Excalidraw bundle.
 */
export const FontFamily = {
    Nunito: 6,
    ComicShanns: 8
} as const;
