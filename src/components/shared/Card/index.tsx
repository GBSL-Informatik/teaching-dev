/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/docusaurus/blob/main/website/src/components/BrowserWindow/index.tsx
 */

import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

interface Props {
    classNames?: {
        card?: string;
        header?: string;
        body?: string;
        footer?: string;
        image?: string;
    };
    style?: React.CSSProperties;
    children?: React.ReactNode;
    image?: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

const Card = observer((props: Props): React.ReactNode => {
    return (
        <div className={clsx('card', props.classNames?.card)} style={props.style}>
            {props.image && <div className={clsx('card__image', props.classNames?.image)}>{props.image}</div>}
            {props.header && (
                <div className={clsx('card__header', props.classNames?.header)}>{props.header}</div>
            )}
            {props.children && (
                <div className={clsx('card__body', props.classNames?.body)}>{props.children}</div>
            )}
            {props.footer && (
                <div className={clsx('card__footer', props.classNames?.footer)}>{props.footer}</div>
            )}
        </div>
    );
});
export default Card;
