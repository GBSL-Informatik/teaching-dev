import { DocumentTypes, RoomType } from '@tdev-api/document';
import type DynamicDocumentRoot from './DynamicDocumentRoot';
import { computed } from 'mobx';
import DocumentStore from '@tdev-stores/DocumentStore';

class DynamicRoom<T extends RoomType> {
    readonly dynamicRoot: DynamicDocumentRoot<T>;
    readonly documentStore: DocumentStore;
    constructor(dynamicRoot: DynamicDocumentRoot<T>, documentStore: DocumentStore) {
        this.dynamicRoot = dynamicRoot;
        this.documentStore = documentStore;
    }

    @computed
    get documents() {
        return this.documentStore.findByDocumentRoot(this.dynamicRoot.rootDocumentId);
    }
}

export default DynamicRoom;
