import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { DocumentType, RoomType } from '@tdev-api/document';
import type DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import SelectInput from '@tdev-components/shared/SelectInput';
import type DocumentRoot from '@tdev-models/DocumentRoot';

interface Props {
    dynamicRoot: DynamicDocumentRoot<RoomType>;
    onChange?: (type: RoomType) => void;
}

export type MessageRoom = DocumentRoot<DocumentType.DynamicDocumentRoot>;

export const RoomTypeLabel: { [key in RoomType]: string } = {
    [RoomType.Messages]: 'Textnachrichten',
    [RoomType.Circuit]: 'Schaltkreis'
};

export const RoomTypeDescription: { [key in RoomType]: string } = {
    [RoomType.Messages]: 'Textnachrichten können in einem Chat versandt- und empfangen werden.',
    [RoomType.Circuit]: 'Interaktive Schaltkreise erzeugen.'
};

const ValidRoomType = new Set<string>(Object.values(RoomType));

const RoomTypeSelector = observer((props: Props) => {
    const { dynamicRoot } = props;
    const options = React.useMemo(() => {
        const values = Object.values(RoomType);
        if (!ValidRoomType.has(dynamicRoot.roomType)) {
            values.push(dynamicRoot.roomType);
        }
        return values.map((o) => {
            return {
                value: o,
                label: RoomTypeLabel[o] ?? o,
                disabled: !ValidRoomType.has(o)
            };
        });
    }, [dynamicRoot.roomType]);

    return (
        <SelectInput
            options={options}
            value={dynamicRoot.roomType}
            disabled={!dynamicRoot.parentDocument?.canChangeType}
            onChange={(value) => {
                dynamicRoot.setRoomType(value as RoomType);
                props?.onChange?.(value as RoomType);
            }}
        />
    );
});

export default RoomTypeSelector;
