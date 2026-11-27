import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export type Skeleton = ExcalidrawElementSkeleton;

export interface Scene {
    elements: Skeleton[];
    files: BinaryFiles;
}

/*
 * Constants of Excalidraw, see `FONT_FAMILY` and `ROUNDNESS` in `@excalidraw/excalidraw`.
 * Repeated here, so that the converter does not import the Excalidraw bundle, which is only loaded when copying.
 */
export const FontFamily = {
    Nunito: 6,
    ComicShanns: 8
} as const;

export const Roundness = {
    Adaptive: 3
} as const;
