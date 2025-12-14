import React from 'react';
import { observer } from 'mobx-react-lite';
import DynamicDocumentRoots, { MetaInit } from '@tdev-models/documents/DynamicDocumentRoots';
import { useStore } from '@tdev-hooks/useStore';
import { v4 as uuidv4 } from 'uuid';
import Button from '@tdev-components/shared/Button';
import { mdiPlusCircleOutline } from '@mdi/js';
import { RoomType } from '@tdev-api/document';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import RoomComponents from '@tdev-components/Rooms/RoomComponents';

interface Props extends MetaInit {
    dynamicDocumentRoots: DynamicDocumentRoots;
}

const AddDynamicDocumentRoot = observer((props: Props) => {
    const { dynamicDocumentRoots } = props;
    const userStore = useStore('userStore');
    const user = userStore.current;
    if (!user || !user.hasElevatedAccess) {
        return null;
    }

    return (
        <div>
            <Button
                text="Neue Gruppe"
                title='Neue "Document Root" hinzufügen'
                icon={mdiPlusCircleOutline}
                iconSide="left"
                disabled={!RWAccess.has(dynamicDocumentRoots.root?.permission)}
                onClick={() => {
                    const newId = uuidv4();
                    const defaultType = (Object.keys(RoomComponents).find(
                        (name) => RoomComponents[name as RoomType]?.default
                    ) ?? Object.keys(RoomComponents)[0]) as RoomType;
                    if (!defaultType) {
                        return;
                    }
                    dynamicDocumentRoots.addDynamicDocumentRoot(
                        newId,
                        `Neue Gruppe (${dynamicDocumentRoots.dynamicDocumentRoots.length + 1})`,
                        defaultType
                    );
                }}
            />
        </div>
    );
});

export default AddDynamicDocumentRoot;
