export const createDownloadCanvas = (node: HTMLCanvasElement | null, text?: string) => {
    if (!node) {
        return;
    }
    const downloadCanvas = document.createElement('canvas');
    const padding = 20;
    const lineWidth = 2;
    const textHeight = text ? 40 : 0;
    const dimensions = node.getBoundingClientRect();
    // Set download canvas dimensions
    downloadCanvas.width = dimensions.width + padding * 2;
    downloadCanvas.height = dimensions.height + padding * 2 + textHeight;

    const ctx = downloadCanvas.getContext('2d');
    if (ctx) {
        // Fill background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = lineWidth;
        // Helper function to draw rounded rectangle
        const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius, radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            ctx.lineTo(x + radius, y + height);
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();
            ctx.stroke();
        };
        roundRect(
            lineWidth / 2,
            lineWidth / 2,
            downloadCanvas.width - lineWidth,
            downloadCanvas.height - lineWidth,
            8
        );

        // Draw the original QR code in the center of the new canvas
        ctx.drawImage(node, padding, padding, dimensions.width, dimensions.height);
        if (text) {
            // Add URL text
            ctx.fillStyle = '#000';
            ctx.font = '20px system-ui';
            ctx.textAlign = 'center';

            // Truncate URL if too long
            let displayUrl = text;
            if (text.length > 40) {
                displayUrl = text.substring(0, 37) + '...';
            }

            ctx.fillText(
                displayUrl,
                downloadCanvas.width / 2,
                dimensions.height + padding * 2 + textHeight / 3
            );
        }
        return downloadCanvas;
    }
};
