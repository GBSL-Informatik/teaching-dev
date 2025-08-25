/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/docusaurus/blob/main/website/src/components/BrowserWindow/index.tsx
 */

import React, { type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

interface Props {
    children: ReactNode;
    minHeight?: number;
    maxHeight?: number | string;
    url?: string;
    style?: CSSProperties;
    bodyStyle?: CSSProperties;
    className?: string;
}

export default function BrowserWindow(props: Props): React.ReactNode {
    const { children, minHeight, maxHeight, url, className, style, bodyStyle } = props;
    return (
        <div className={clsx(styles.browserWindow, className)} style={style}>
            <div className={styles.browserWindowHeader}>
                <div className={styles.buttons}>
                    <span className={styles.dot} style={{ background: '#f25f58' }} />
                    <span className={styles.dot} style={{ background: '#fbbe3c' }} />
                    <span className={styles.dot} style={{ background: '#58cb42' }} />
                </div>
                <div className={clsx(styles.browserWindowAddressBar, 'text--truncate')}>
                    {url || 'http://localhost:3000'}
                </div>
                <div className={styles.browserWindowMenuIcon}>
                    <div>
                        <span className={styles.bar} />
                        <span className={styles.bar} />
                        <span className={styles.bar} />
                    </div>
                </div>
            </div>

            <div
                className={styles.browserWindowBody}
                style={{ ...bodyStyle, minHeight, maxHeight, overflowY: maxHeight ? 'auto' : undefined }}
            >
                {children}
            </div>
        </div>
    );
}
