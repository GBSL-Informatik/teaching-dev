import { mdiPlusCircleOutline } from '@mdi/js';
import { ContainerType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props {
    dynamicDocumentRoot: DynamicDocumentRoots<ContainerType>;
}

const AddDynamicDocumentRoot = observer((props: Props) => {
    const { dynamicDocumentRoot } = props;
    const userStore = useStore('userStore');
    const user = userStore.current;
    const permissionStore = useStore('permissionStore');
    React.useEffect(() => {
        if (!dynamicDocumentRoot.root || !user?.hasElevatedAccess) {
            return;
        }
        permissionStore.loadAllPermissions([dynamicDocumentRoot.documentRootId]);
    }, [dynamicDocumentRoot?.root, user?.hasElevatedAccess]);
    if (!user || !user.hasElevatedAccess) {
        return null;
    }

    return (
        <div>
            <Button
                text={`${dynamicDocumentRoot.defaultContainerMeta.name}`}
                title={`"${dynamicDocumentRoot.defaultContainerMeta.name}" hinzufügen`}
                icon={mdiPlusCircleOutline}
                iconSide="left"
                disabled={!dynamicDocumentRoot || !RWAccess.has(dynamicDocumentRoot.root?.permission)}
                onClick={() => {
                    dynamicDocumentRoot.addDynamicDocumentRoot();
                }}
            />
        </div>
    );
});

export default AddDynamicDocumentRoot;
