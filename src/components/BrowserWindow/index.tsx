/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/docusaurus/blob/main/website/src/components/BrowserWindow/index.tsx
 */

import clsx from 'clsx';
import React, { type CSSProperties, type ReactNode } from 'react';

import Header from './Header';
import styles from './styles.module.css';

interface Props {
    children: ReactNode;
    minHeight?: number | string;
    maxHeight?: number | string;
    url?: string;
    href?: string;
    style?: CSSProperties;
    bodyStyle?: CSSProperties;
    className?: string;
}

const BrowserWindow = (props: Props): React.ReactNode => {
    const { children, minHeight, maxHeight, url, href, className, style, bodyStyle } = props;
    return (
        <div className={clsx(styles.browserWindow, className)} style={style}>
            <Header url={url} href={href} />

            <div
                className={styles.browserWindowBody}
                style={{ ...bodyStyle, minHeight, maxHeight, overflowY: maxHeight ? 'auto' : undefined }}
            >
                {children}
            </div>
        </div>
    );
};
export default BrowserWindow;
