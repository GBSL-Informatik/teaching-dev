import React from 'react';
import { observer } from 'mobx-react-lite';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiPlusCircleOutline } from '@mdi/js';
import { ContainerType } from '@tdev-api/document';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';

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
        permissionStore.loadPermissions(dynamicDocumentRoot.root);
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
