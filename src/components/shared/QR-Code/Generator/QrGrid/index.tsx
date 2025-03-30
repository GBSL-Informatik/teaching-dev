import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Generator, { Props as DefaultProps } from '..';
import { mdiDownload } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props extends Omit<DefaultProps, 'text' | 'onCanvas'> {
    qrTexts: string[];
    cols?: number;
}

const QrGrid = observer((props: Props) => {
    const { qrTexts } = props;
    const qrRefs = React.useRef<Array<HTMLCanvasElement | null>>(Array(qrTexts.length).fill(null));
    const onDownload = React.useCallback(() => {
        const canvs = qrRefs.current.filter((qr) => !!qr);
        if (canvs.length < 1) {
            return;
        }
        const cols = props.cols || 2;
        const rows = Math.ceil(canvs.length / cols);
        const dimX = canvs[0].width;
        const dimY = canvs[0].height;
        const gap = 10;
        const downloadCanvas = document.createElement('canvas');
        const ctx = downloadCanvas.getContext('2d');
        if (!ctx) {
            return;
        }
        // Set download canvas dimensions
        downloadCanvas.width = cols * dimX + (cols - 1) * gap;
        downloadCanvas.height = rows * dimY + (rows - 1) * gap;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const idx = y * cols + x;
                const canv = canvs[idx];
                if (canv) {
                    ctx.drawImage(canv, x * (dimX + gap), y * (dimY + gap), dimX, dimY);
                }
            }
        }
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
    }, [qrRefs.current]);
    return (
        <>
            <Button icon={mdiDownload} onClick={onDownload} size={SIZE_S} />
            <div className={clsx(styles.qrGrid)} style={{ ['--qr-cols' as any]: props.cols || 2 }}>
                {qrTexts.map((text, idx) => {
                    return (
                        <Generator
                            {...props}
                            text={text}
                            key={idx}
                            onCanvas={(canv) => {
                                qrRefs.current[idx] = canv;
                                console.log(qrRefs.current, canv);
                            }}
                            className={clsx(styles.qr)}
                        />
                    );
                })}
            </div>
        </>
    );
});

export default QrGrid;
