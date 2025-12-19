import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { DummyMeta } from '@tdev-models/DocumentRoot';

interface Props {
    pageId: string;
}

/**
 * This component is used to load the current page and its content.
 */
const MdxPage = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const { pageId } = props;
    useDocumentRoot(pageId, new DummyMeta(), false);
    React.useEffect(() => {
        if (pageId) {
            pageStore.addIfNotPresent(pageId, true);
        }
        return () => {
            pageStore.setCurrentPageId(undefined);
        };
    }, [pageId]);
    React.useEffect(() => {
        const { current } = pageStore;
        if (!current || !userStore.current?.hasElevatedAccess) {
            return;
        }
        if (userStore.viewedUserId && userStore.viewedUserId !== userStore.current?.id) {
            current.loadLinkedDocumentRoots();
        }
    }, [pageStore.current, userStore.viewedUserId]);
    return null;
});

export default MdxPage;
