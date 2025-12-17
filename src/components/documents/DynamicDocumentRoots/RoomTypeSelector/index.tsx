import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { RoomType } from '@tdev-api/document';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    dynamicRoot: DynamicDocumentRoot;
}

const RoomTypeSelector = observer((props: Props) => {
    const { dynamicRoot } = props;
    const componentStore = useStore('componentStore');
    const isInvalidRoomType = !componentStore.isValidRoomType(dynamicRoot.props?.type);
    return (
        <div className={clsx(styles.typeSelector)}>
            <select
                className={clsx(styles.select, isInvalidRoomType && styles.invalid)}
                value={dynamicRoot.props?.type || ''}
                onChange={(e) => {
                    dynamicRoot.setRoomType(e.target.value as RoomType);
                }}
            >
                {isInvalidRoomType && (
                    <option value={dynamicRoot.props?.type || ''} disabled>
                        {dynamicRoot.props?.type || '-'}
                    </option>
                )}
                {componentStore.registeredRoomTypes.map((type) => {
                    const component = componentStore.components.get(type);
                    if (!component) {
                        return null;
                    }
                    return (
                        <option key={type} value={type} title={component.description}>
                            {component.name}
                        </option>
                    );
                })}
            </select>
        </div>
    );
});

export default RoomTypeSelector;
