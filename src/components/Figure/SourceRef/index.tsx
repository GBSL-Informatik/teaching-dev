import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiOpenInNew } from '@mdi/js';

interface Bib {
    author?: string;
    source?: string;
    licence?: string;
    licence_url?: string;
    edited?: boolean;
}

interface Props {
    bib: Bib;
    className?: string;
    metaClassName?: string;
}

const SourceRef = (props: Props) => {
    const { bib } = props;
    const [visible, setVisible] = React.useState(false);

    return (
        <>
            <span
                className={clsx(styles.bib, visible ? styles.visible : undefined, props.className)}
                onClick={() => setVisible(!visible)}
            >
                @
            </span>
            {visible && (
                <div className={clsx(styles.meta, props.metaClassName)}>
                    <span className={clsx('badge badge--secondary', styles.refItem)}>
                        Autor: {bib.author}
                    </span>
                    <a href={bib.licence_url} target="_blank" className={styles.refItem}>
                        <span className={clsx('badge badge--secondary')}>Lizenz: {bib.licence}</span>
                    </a>
                    {bib.edited && (
                        <span className={clsx('badge badge--secondary', styles.refItem)}>Bearbeitet</span>
                    )}
                    <a href={bib.source} target="_blank" className={styles.refItem}>
                        <span className={clsx('badge badge--secondary', styles.iconBadge)}>
                            <Icon path={mdiOpenInNew} size={0.7} />
                        </span>
                    </a>
                </div>
            )}
        </>
    );
};

export default SourceRef;
