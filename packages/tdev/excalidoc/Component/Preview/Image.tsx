import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import _ from 'lodash';
import clsx from 'clsx';

export interface Props {
    image?: string;
}

const Image = observer((props: Props) => {
    const hasImage = !!props.image;
    return (
        <div className={clsx('card__image', styles.image)}>
            <img
                src={props.image || require('./images/excalidraw-logo.png').default}
                className={clsx(!hasImage && styles.default)}
            />
        </div>
    );
});

export default Image;
