import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiLoading } from '@mdi/js';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface Props {
    label?: string;
    overlay?: boolean;
    size?: number;
    className?: string;
    noLabel?: boolean;
    title?: string;
    align?: 'center' | 'left' | 'right';
}

const Loader = (props: Props) => {
    /**
     * Prevent the spinner from spinning when it is not rendered
     * on the screen. This prevents rehydration issues.
     */
    const isBrowser = useIsBrowser();
    return (
        <div
            className={clsx(
                styles.loader,
                props.className,
                props.overlay && styles.overlay,
                props.align && styles[props.align]
            )}
            title={props.title}
        >
            <Icon path={mdiLoading} spin={isBrowser} size={props.size || 1} className={styles.icon} />
            {!props.noLabel && (
                <span className={clsx('badge', styles.badge)}>{props.label || 'Laden...'}</span>
            )}
        </div>
    );
};

export default Loader;
