import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { DocumentType, RoomType } from '@tdev-api/document';
import type DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import SelectInput from '@tdev-components/shared/SelectInput';
import type DocumentRoot from '@tdev-models/DocumentRoot';

interface Props {
    dynamicRoot: DynamicDocumentRoot<RoomType>;
    onChange?: (type: RoomType) => void;
}

const RoomTypeSelector = observer((props: Props) => {
    const { dynamicRoot } = props;
    const componentStore = useStore('componentStore');
    const isInvalidRoomType = !componentStore.isValidRoomType(dynamicRoot.props?.type);
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
