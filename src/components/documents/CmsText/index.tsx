import { observer } from 'mobx-react-lite';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import React from 'react';
import CmsActions from './CmsActions';
import { CmsTextEntries } from './WithCmsText';
import { useStore } from '@tdev-hooks/useStore';

export interface Props {
    id?: string;
    showActions?: boolean;
    name?: string;
    mode?: 'xlsx' | 'code';
}

const CmsText = observer((props: Props) => {
    const { id, name, showActions } = props;
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const userStore = useStore('userStore');
    const rootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(rootId);
    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return showActions && rootId ? (
            <CmsActions entries={{ [rootId]: rootId } as CmsTextEntries} mode={props.mode} />
        ) : null;
    }

    return (
        <>
            {showActions && rootId && (
                <CmsActions entries={{ [rootId]: rootId } as CmsTextEntries} mode={props.mode} />
            )}
            {cmsText.text}
        </>
    );
});

export default CmsText;
