import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';

import { QRCodeCanvas } from 'qrcode.react';
import Link from '@docusaurus/Link';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import useIsBrowser from '@docusaurus/useIsBrowser';

const MdiPathToBase64 = (path: string, color: string = '#306cce') => {
    const img = `<svg viewBox="0 0 24 24" role="presentation" style="width: 32px; height: 32px;" xmlns="http://www.w3.org/2000/svg"><path d="${path}" style="fill: ${color};"></path></svg>`;
    return `data:image/svg+xml;base64,${window.btoa(img)}`;
};

interface Props {
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
}
const Generator = (props: Props) => {
    const [text, setText] = React.useState(props.text || '');
    const [width, setWidth] = React.useState<number | undefined>(208); // 13 * 16 = 208, 1em = 16px
    const ref = React.useRef<HTMLDivElement>(null);
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
    const showFooter = props.showText;

    return (
        <div className={clsx('card', styles.qr, props.className)} style={{ width: props.size }}>
            <div className={clsx(styles.generator, 'card__body')}>
                <div ref={ref}>
                    <QRCodeCanvas
                        {...(props.qrProps || {})}
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
                </div>
            )}
        </div>
    );
};

export default Generator;
