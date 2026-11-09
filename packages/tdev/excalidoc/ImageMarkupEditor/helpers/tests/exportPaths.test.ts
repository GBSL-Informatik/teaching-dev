import { describe, expect, it } from 'vitest';
import exportPaths from '../exportPaths';

describe('exportPaths', () => {
    it('keeps the paths when the image is not converted', () => {
        expect(
            exportPaths('docs/images/cat.png', 'docs/images/cat.png.excalidraw', 'cat.png', false)
        ).toEqual({
            imgExport: 'docs/images/cat.png',
            excaliExport: 'docs/images/cat.png.excalidraw',
            isRenamed: false
        });
    });

    it('renames the image and the sidecar to webp', () => {
        expect(exportPaths('docs/images/cat.png', 'docs/images/cat.png.excalidraw', 'cat.png', true)).toEqual(
            {
                imgExport: 'docs/images/cat.webp',
                excaliExport: 'docs/images/cat.webp.excalidraw',
                isRenamed: true
            }
        );
    });

    it('does not rename an image that already is a webp', () => {
        expect(exportPaths('cat.webp', 'cat.webp.excalidraw', 'cat.webp', true).isRenamed).toBe(false);
    });
});
