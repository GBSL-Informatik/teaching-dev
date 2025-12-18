export const createDownloadCanvas = (
    node: HTMLCanvasElement | null,
    dimensions: { width: number; height: number }
) => {
    if (!node) {
        return;
    }
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = dimensions.width;
    downloadCanvas.height = dimensions.height;

    const ctx = downloadCanvas.getContext('2d');
    if (ctx) {
        // Fill background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

        ctx.drawImage(node, 0, 0, dimensions.width, dimensions.height);
        return downloadCanvas;
    }
};
