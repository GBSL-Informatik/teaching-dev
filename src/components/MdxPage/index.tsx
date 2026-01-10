import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import type { DocumentType } from '@tdev-api/document';

interface Props {
    pageId: string;
}

export class PageMeta extends TypeMeta<DocumentType> {
    constructor() {
        super('_page_' as DocumentType);
    }
    get defaultData() {
        return {};
    }
}

/**
 * This component is used to load the current page and its content.
 */
const MdxPage = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const { pageId } = props;
    const [meta] = React.useState(new PageMeta());
    useDocumentRoot(pageId, meta, false);
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
