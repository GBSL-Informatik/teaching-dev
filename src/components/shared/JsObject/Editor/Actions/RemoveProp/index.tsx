import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiCloseCircleOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import iJs from '../../models/iJs';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

interface Props {
    js: iJs;
}

const RemoveProp = observer((props: Props) => {
    const { js } = props;
    return (
        <div className={clsx(styles.changeType)}>
            <Confirm
                size={SIZE_XS}
                icon={mdiCloseCircleOutline}
                color="red"
                onConfirm={() => {
                    js.remove();
                }}
            />
        </div>
    );
});

export default RemoveProp;
