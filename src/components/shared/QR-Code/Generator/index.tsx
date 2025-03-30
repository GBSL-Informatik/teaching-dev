import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';

import { QRCodeCanvas } from 'qrcode.react';
import Link from '@docusaurus/Link';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Button from '@tdev-components/shared/Button';
import { mdiDownload } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { createDownloadCanvas } from './createDownloadCanvas';

const MdiPathToBase64 = (path: string, color: string = '#306cce') => {
    const img = `<svg viewBox="0 0 24 24" role="presentation" style="width: 32px; height: 32px;" xmlns="http://www.w3.org/2000/svg"><path d="${path}" style="fill: ${color};"></path></svg>`;
    return `data:image/svg+xml;base64,${window.btoa(img)}`;
};

export interface Props {
    text: string;
    showText?: boolean;
    size?: string | number;
    className?: string;
    isLink?: boolean;
    withInput?: boolean;
    qrProps?: React.ComponentProps<typeof QRCodeCanvas>;
    /**
     * Mdi icon path - will be embedded in svg and transformed to base64
     */
    icon?: string;
    image?: string;
    iconColor?: string;
    iconSize?: number;
    download?: boolean;
    onCanvas?: (canvas: HTMLCanvasElement) => void;
}
const Generator = (props: Props) => {
    const [text, setText] = React.useState(props.text || '');
    const [width, setWidth] = React.useState<number | undefined>(208); // 13 * 16 = 208, 1em = 16px
    const ref = React.useRef<HTMLDivElement>(null);
    const qrRef = React.useRef<HTMLCanvasElement>(null);
    const isBrowser = useIsBrowser();
    React.useEffect(() => {
        const element = ref.current;
        if (element) {
            const { width } = element.getBoundingClientRect();
            setWidth(width);
            const resizeObserver = new ResizeObserver((entries) => {
                setWidth(entries[0].contentRect.width);
            });
            resizeObserver.observe(element);
            return () => {
                resizeObserver.unobserve(element);
            };
        }
    }, []);

    React.useEffect(() => {
        if (!props.onCanvas) {
            return;
        }
        const canvas = createDownloadCanvas(qrRef.current, text);
        if (!canvas) {
            return;
        }
        props.onCanvas(canvas);
    }, [props.onCanvas, text, qrRef, width]);

    const onDownload = React.useCallback(() => {
        const canvas = createDownloadCanvas(qrRef.current, text);
        if (!canvas) {
            return;
        }
        // Create download link
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, [text, qrRef, width]);

    const showFooter = props.showText || props.download;

    return (
        <div className={clsx('card', styles.qr, props.className)} style={{ width: props.size }}>
            <div className={clsx(styles.generator, 'card__body')}>
                <div ref={ref}>
                    <QRCodeCanvas
                        {...(props.qrProps || {})}
                        ref={qrRef}
                        value={text}
                        size={width}
                        className={clsx(styles.qrImage)}
                        imageSettings={
                            (props.icon || props.image) && isBrowser
                                ? {
                                      height: props.iconSize ?? 32,
                                      width: props.iconSize ?? 32,
                                      excavate: true,
                                      opacity: 1,
                                      ...(props.qrProps?.imageSettings || {}),
                                      src: props.image
                                          ? props.image
                                          : MdiPathToBase64(props.icon!, props.iconColor)
                                  }
                                : undefined
                        }
                    />
                </div>
                {props.withInput && (
                    <TextAreaInput
                        defaultValue={props.text}
                        onChange={setText}
                        className={clsx(styles.qrInput)}
                    />
                )}
            </div>
            {showFooter && (
                <div className={clsx(styles.footer, 'card__footer')}>
                    {props.isLink ? (
                        <Link to={props.text} className={clsx(styles.qrText)}>
                            {props.text}
                        </Link>
                    ) : (
                        <div className={clsx(styles.qrText)}>{props.text}</div>
                    )}
                    {props.download && <Button icon={mdiDownload} onClick={onDownload} size={SIZE_S} />}
                </div>
            )}
        </div>
    );
};

export default Generator;
