import { observer } from 'mobx-react-lite';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { useStore } from '@tdev-hooks/useStore';

export interface Props {
    id?: string;
    showPermissionsPanel?: boolean;
    name?: string;
}

const CmsText = observer(({ id, name, showPermissionsPanel }: Props) => {
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const userStore = useStore('userStore');
    const rootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(rootId);
    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return showPermissionsPanel && rootId ? <PermissionsPanel documentRootId={rootId} /> : null;
    }

    return (
        <>
            {showPermissionsPanel && rootId && <PermissionsPanel documentRootId={rootId} />}
            {cmsText.text}
        </>
    );
});

export default CmsText;
