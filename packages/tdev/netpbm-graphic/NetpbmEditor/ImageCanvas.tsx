import React, { useEffect, useRef } from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Button from '@tdev-components/shared/Button';
import { mdiImage, mdiImageSizeSelectLarge } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { createDownloadCanvas } from './createDownloadCanvas';

interface Props {
    pixels?: Uint8ClampedArray;
    width: number;
    height: number;
    format: 'P1' | 'P2' | 'P3';
    extension: 'pbm' | 'pgm' | 'ppm';
    actionsClassName?: string;
}

const ImageCanvas = (props: Props) => {
    const { width, height, pixels } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
        const scale = Math.min(50, Math.max(1, Math.floor(window.innerWidth / width)));

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
    }, [pixels, width, height, offsetX, offsetY]);

    const onDownload = React.useCallback(
        (size: 'original' | 'scaled') => {
            if (!canvasRef.current) {
                return;
            }
            const dWidth = size === 'original' ? width : canvasRef.current.width;
            const dHeight = size === 'original' ? height : canvasRef.current.height;
            const canvas = createDownloadCanvas(canvasRef.current, { width: dWidth, height: dHeight });
            if (!canvas) {
                return;
            }
            // Create download link
            const link = document.createElement('a');
            link.download = `${props.format}_${width}x${height}${size === 'original' ? '' : `_zoomfaktor_${Math.round((10 * dWidth) / width) / 10}`}.${props.extension}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        },
        [width, height, canvasRef]
    );

    return (
        <>
            <canvas className={clsx(styles.canvas, { [styles.hidden]: hidden() })} ref={canvasRef} />
            {canvasRef.current && width > 0 && height > 0 && (
                <div className={clsx(props.actionsClassName)}>
                    <Button
                        color="primary"
                        icon={mdiImage}
                        size={SIZE_S}
                        onClick={() => onDownload('scaled')}
                        title={`Bild als PNG herunterladen (gross, ${canvasRef.current?.width}x${canvasRef.current?.height}px)`}
                    />
                    <Button
                        color="primary"
                        icon={mdiImageSizeSelectLarge}
                        size={SIZE_S}
                        onClick={() => onDownload('original')}
                        title={`Original-Bild als PNG herunterladen (klein, ${width}x${height}px)`}
                    />
                </div>
            )}
        </>
    );
};

export default ImageCanvas;
