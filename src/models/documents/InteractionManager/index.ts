import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TaskStateData,
    StateType,
    TypeDataMapping,
    Access
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export enum UserInteractionType {
    TextConversation = 'TextConversation'
}

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all DocumentType.InteractionManager values to your new models Type
export class ModelMeta extends TypeMeta<DocumentType.InteractionManager> {
    readonly type = DocumentType.InteractionManager;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.InteractionManager, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.InteractionManager] {
        return {
            interactionRootDocumentIds: []
        };
    }
}

class InteractionManager extends iDocument<DocumentType.InteractionManager> {
    interactionRootDocumentIds = observable.array<string>([]);
    constructor(props: DocumentProps<DocumentType.InteractionManager>, store: DocumentStore) {
        super(props, store);
        this.interactionRootDocumentIds.replace(props.data.interactionRootDocumentIds);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.InteractionManager], from: Source, updatedAt?: Date): void {
        this.interactionRootDocumentIds.replace(data.interactionRootDocumentIds);
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @computed
    get interactionRootDocuments() {
        return this.interactionRootDocumentIds
            .map((id) => this.store.root.documentRootStore.find(id))
            .filter((d) => !!d);
    }

    get data(): TypeDataMapping[DocumentType.InteractionManager] {
        return {
            interactionRootDocumentIds: this.interactionRootDocumentIds.slice()
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.InteractionManager) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default InteractionManager;
