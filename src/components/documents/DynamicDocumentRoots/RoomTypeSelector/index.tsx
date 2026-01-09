import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { RoomType } from '@tdev-api/document';
import type DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import SelectInput from '@tdev-components/shared/SelectInput';

interface Props {
    dynamicRoot: DynamicDocumentRoot<RoomType>;
    onChange?: (type: RoomType) => void;
}

const RoomTypeSelector = observer((props: Props) => {
    const { dynamicRoot } = props;
    const componentStore = useStore('componentStore');
    const options = React.useMemo(() => {
        const values = componentStore.registeredRoomTypes;
        if (!componentStore.isValidRoomType(dynamicRoot.roomType)) {
            values.push(dynamicRoot.roomType);
        }
        return values.map((o) => {
            return {
                value: o,
                label: componentStore.components.get(o)?.name ?? o,
                disabled: !componentStore.isValidRoomType(o)
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
