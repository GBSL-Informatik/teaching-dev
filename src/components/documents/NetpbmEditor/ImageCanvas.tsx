import React, { useEffect, useRef } from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';

interface Props {
    pixels?: Uint8ClampedArray;
    width: number;
    height: number;
}

const ImageCanvas = ({ width, height, pixels }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const scale = 50;
    const offsetX = 0;
    const offsetY = 0;

    const hidden = () => {
        return !pixels || pixels.length === 0 || width === 0 || height === 0;
    };

    useEffect(() => {
        if (hidden()) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) {
            return;
        }

        // Get device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        // Set display size (css pixels)
        const displayWidth = width * scale;
        const displayHeight = height * scale;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);

        // Scale context to match the device pixel ratio
        ctx.scale(dpr, dpr);

        // Create a temporary canvas to hold the original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
            return;
        }

        // Put the image data on the temporary canvas
        const imageData = new ImageData(pixels!, width, height);
        tempCtx.putImageData(imageData, 0, 0);

        // Clear the main canvas and draw the scaled image
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, offsetX, offsetY, displayWidth, displayHeight);
    }, [pixels, width, height, scale, offsetX, offsetY]);

    return <canvas className={clsx(styles.canvas, { [styles.hidden]: hidden() })} ref={canvasRef} />;
};

export default ImageCanvas;
