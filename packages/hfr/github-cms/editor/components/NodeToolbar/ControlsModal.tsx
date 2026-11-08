import { mdiDotsVertical } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';

interface Props {
    title: React.ReactNode;
    children: React.ReactNode;
}

/**
 * The controls of a node toolbar in a modal, opened with a menu button.
 * Used when the controls do not fit next to the title.
 */
const ControlsModal = ({ title, children }: Props) => {
    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiDotsVertical} size={SIZE_S} title="Aktionen" />
                </span>
            }
            modal
            on="click"
            nested
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card header={<h4>{title}</h4>} classNames={{ card: styles.modal, body: clsx(styles.modalBody) }}>
                {children}
            </Card>
        </Popup>
    );
};

export default ControlsModal;
