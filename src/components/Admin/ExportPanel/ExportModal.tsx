import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import ExportPanel, { Props as ExportProps } from '.';
import type { PopupActions } from 'reactjs-popup/dist/types';
import Popup from 'reactjs-popup';
import { mdiDatabaseExport } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props extends Omit<ExportProps, 'onClose'> {
    className?: string;
    triggerLabel?: string;
    title?: string;
}
const ExportModal = observer((props: Props) => {
    const ref = React.useRef<PopupActions>(null);

    return (
        <Popup
            trigger={
                <span className={clsx(props.className)} title={props.title}>
                    <Button
                        icon={mdiDatabaseExport}
                        text={props.triggerLabel as string}
                        size={SIZE_S}
                        iconSide="left"
                    />
                </span>
            }
            lockScroll
            nested
            ref={ref}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <div>
                <ExportPanel
                    userIds={props.userIds}
                    fileName={props.fileName}
                    onClose={() => {
                        ref.current?.close?.();
                    }}
                    name={props.name}
                />
            </div>
        </Popup>
    );
});

export default ExportModal;
