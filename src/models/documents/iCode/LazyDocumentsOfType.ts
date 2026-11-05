import type { DocumentType, TypeModelMapping } from '@tdev-api/document';
import type iDocument from '@tdev-models/iDocument';
import { orderBy } from 'es-toolkit/array';
import { action, compareShallow, computed, observable } from 'mobx';

/**
 * Documents of one type in the anchor's document root, written by the anchor's author
 * and loaded only on demand.
 */
class LazyDocumentsOfType<Type extends DocumentType> {
    readonly anchor: iDocument<any>;
    readonly type: Type;
    @observable accessor isLoaded: boolean = false;

    constructor(anchor: iDocument<any>, type: Type) {
        this.anchor = anchor;
        this.type = type;
    }

    @action
    load(force: boolean = false) {
        if (this.isLoaded && !force) {
            return;
        }
        this.isLoaded = true;
        this.anchor.store.root.documentRootStore.loadInNextBatch(
            this.anchor.documentRootId,
            this.anchor.root?.meta,
            {
                documentType: this.type,
                skipCreate: true,
                documentRoot: false,
                groupPermissions: false,
                userPermissions: false
            }
        );
    }

    @computed({ equals: compareShallow })
    get items(): TypeModelMapping[Type][] {
        const documents = (this.anchor.root?.documents || []).filter(
            (doc) => doc.type === this.type && doc.authorId === this.anchor.authorId
        ) as TypeModelMapping[Type][];
        return orderBy(documents, ['createdAt'], ['asc']);
    }
}

export default LazyDocumentsOfType;
