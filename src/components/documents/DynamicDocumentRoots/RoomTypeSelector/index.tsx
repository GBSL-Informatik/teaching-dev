import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { RoomType } from '@tdev-api/document';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import SelectInput from '@tdev-components/shared/SelectInput';

interface Props {
    dynamicRoot: DynamicDocumentRoot;
    onChange?: (type: RoomType) => void;
}

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
        if (dynamicRoot.props?.type && !ValidRoomType.has(dynamicRoot.props?.type || '')) {
            values.push(dynamicRoot.props.type);
        }
        return values.map((o) => {
            return {
                value: o,
                label: RoomTypeLabel[o] ?? o,
                disabled: !ValidRoomType.has(o)
            };
        });
    }, [dynamicRoot.props?.type]);

    return (
        <SelectInput
            options={options}
            value={dynamicRoot.props?.type || ''}
            onChange={(value) => {
                dynamicRoot.setRoomType(value as RoomType);
                props?.onChange?.(value as RoomType);
            }}
        />
    );
});

export default RoomTypeSelector;
