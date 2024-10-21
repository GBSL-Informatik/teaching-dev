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
    TextConversation = 'TextConversation',
}

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all DocumentType.UserInteraction values to your new models Type
export class ModelMeta extends TypeMeta<DocumentType.UserInteraction> {
    readonly type = DocumentType.UserInteraction;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.UserInteraction, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.UserInteraction] {
        return {};
    }
}

class UserInteraction extends iDocument<DocumentType.UserInteraction> {
    constructor(props: DocumentProps<DocumentType.UserInteraction>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.UserInteraction], from: Source, updatedAt?: Date): void {
        // TODO: change state according to data
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.UserInteraction] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.UserInteraction) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default UserInteraction;
