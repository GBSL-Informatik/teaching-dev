import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';

const defaultUnit = (value: string | number, unit: string = 'px') => {
    // when only a number is given, add the default unit
    if (/^\d+(\.\d*)?$/.test(`${value}`)) {
        return `${value}${unit}`;
    }
    return `${value}`;
};

interface Props {
    children?: React.ReactNode;
    options?: React.CSSProperties;
}

const IMG_STYLE_PROPS = ['width', 'maxWidth', 'maxHeight', 'height'];

export default function Figure(props: Props): JSX.Element {
    const ref = React.useRef<HTMLElement>(null);
    const opts = { ...props.options };
    if (opts) {
        if ('size' in opts) {
            opts.maxWidth = `min(90vw, ${defaultUnit((opts as { size: string }).size)}, 100%)`;
            opts.maxHeight = defaultUnit((opts as { size: string }).size);
            delete opts['size'];
        }
        if (opts.height) {
            opts.maxWidth = 'min(90vw, 100%)';
            opts.height = defaultUnit(opts.height);
            // delete opts.height;
        }
        if (opts.width) {
            opts.maxWidth = `min(90vw, ${defaultUnit(opts.width)}, 100%)`;
            opts.width = defaultUnit(opts.width);
            // delete opts.width;
        }
    }
    React.useEffect(() => {
        if (!ref.current) {
            return;
        }
        const img = ref.current.firstChild as HTMLImageElement;
        if (img && opts) {
            IMG_STYLE_PROPS.forEach((key) => {
                if (key in opts) {
                    img.style[key as any] = (opts as any)[key];
                }
            });
        }
    }, [ref]);
    return (
        <figure className={clsx(styles.figure, 'figure')} style={opts} ref={ref}>
            {props.children}
        </figure>
    );
}
