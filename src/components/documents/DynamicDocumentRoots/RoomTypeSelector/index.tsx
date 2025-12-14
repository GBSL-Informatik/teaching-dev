import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { RoomType } from '@tdev-api/document';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import RoomComponents from '@tdev-components/Rooms/RoomComponents';

interface Props {
    dynamicRoot: DynamicDocumentRoot;
}

const roomTypes = Object.keys(RoomComponents) as RoomType[];
const ValidRoomType = new Set<string>(roomTypes);

const RoomTypeSelector = observer((props: Props) => {
    const { dynamicRoot } = props;
    const invalidRoomType = !ValidRoomType.has(dynamicRoot.props?.type || '');
    return (
        <div className={clsx(styles.typeSelector)}>
            <select
                className={clsx(styles.select, invalidRoomType && styles.invalid)}
                value={dynamicRoot.props?.type || ''}
                onChange={(e) => {
                    dynamicRoot.setRoomType(e.target.value as RoomType);
                }}
            >
                {invalidRoomType && (
                    <option value={dynamicRoot.props?.type || ''} disabled>
                        {dynamicRoot.props?.type || '-'}
                    </option>
                )}
                {roomTypes.map((type) => (
                    <option key={type} value={type} title={RoomComponents[type]!.description}>
                        {RoomComponents[type]!.name}
                    </option>
                ))}
            </select>
        </div>
    );
});

export default RoomTypeSelector;
