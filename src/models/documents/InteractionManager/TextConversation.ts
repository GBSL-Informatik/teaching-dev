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

// TODO: replace all DocumentType.UserInteraction values to your new models Type
export class ModelMeta extends TypeMeta<DocumentType.UserInteraction> {
    readonly type = DocumentType.UserInteraction;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.UserInteraction, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.UserInteraction] {
        return {
            name: ''
        };
    }
}

class UserInteraction extends iDocument<DocumentType.UserInteraction> {
    @observable accessor name: string = '';

    constructor(props: DocumentProps<DocumentType.UserInteraction>, store: DocumentStore) {
        super(props, store);
        this.name = props.data.name;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.UserInteraction], from: Source, updatedAt?: Date): void {
        this.name = data.name;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    setName(name: string) {
        this.setData({ name: name }, Source.LOCAL);
    }

    get data(): TypeDataMapping[DocumentType.UserInteraction] {
        return {
            name: this.name
        };
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
