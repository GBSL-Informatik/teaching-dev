import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

interface Props {
    url?: string;
    href?: string;
    /** replaces the content of the address bar, e.g. with an editor */
    addressBar?: React.ReactNode;
}

const Header = (props: Props): React.ReactNode => {
    const { url, href, addressBar } = props;
    return (
        <div className={styles.browserWindowHeader}>
            <div className={styles.buttons}>
                <span className={styles.dot} style={{ background: '#f25f58' }} />
                <span className={styles.dot} style={{ background: '#fbbe3c' }} />
                <span className={styles.dot} style={{ background: '#58cb42' }} />
            </div>
            <div className={clsx(styles.browserWindowAddressBar, href && styles.href, 'text--truncate')}>
                {addressBar ??
                    (href ? (
                        <a href={href} target="_blank">
                            {url ?? href}
                        </a>
                    ) : (
                        <>{url || 'http://localhost:3000'}</>
                    ))}
            </div>
            <div className={styles.browserWindowMenuIcon}>
                <div>
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                </div>
            </div>
        </div>
    );
};

export default Header;
