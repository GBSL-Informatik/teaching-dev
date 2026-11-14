import { mdiDraw } from '@mdi/js';
import { sanitizeFileName } from '../../models/helpers';
import type MdxDocument from '../models/MdxDocument';
import type { QuickAction } from './quickActions';

/** the image formats of new drawings, the first one is the default */
const FORMATS = [
    { extension: 'webp', mimeType: 'image/webp' },
    { extension: 'png', mimeType: 'image/png' },
    { extension: 'jpg', mimeType: 'image/jpeg' },
    { extension: 'svg', mimeType: 'image/svg+xml' }
];

const askForFileName = (extension: string) => {
    const name = window.prompt(`Name der neuen Zeichnung (.${extension}):`, 'zeichnung')?.trim();
    if (!name) {
        return null;
    }
    const baseName = sanitizeFileName(name).replace(/\.(webp|png|jpe?g|svg)$/i, '');
    return `${baseName}.${extension}`;
};

/**
 * `/excalidraw-new` (webp) and `/excalidraw-png-new`, ...: a new drawing in `./images`,
 * inserted at the cursor once it is saved. See `NewDrawingEditor`.
 */
export const newDrawingActions = (document: MdxDocument): QuickAction[] => {
    return FORMATS.map(({ extension, mimeType }, index) => ({
        label: `Neue Excalidraw-Zeichnung (${extension})`,
        icon: mdiDraw,
        keywords:
            index === 0 ? ['excalidraw-new', `excalidraw-${extension}-new`] : [`excalidraw-${extension}-new`],
        command: (_state, dispatch) => {
            if (!dispatch) {
                return true;
            }
            const fileName = askForFileName(extension);
            if (fileName && !document.startNewDrawing(fileName, mimeType)) {
                window.alert(`Das Bild "${fileName}" existiert bereits.`);
            }
            return true;
        }
    }));
};
