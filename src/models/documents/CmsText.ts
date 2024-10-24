import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    solution?: string;
    default?: string;
    sanitizer?: (val: string) => string;
    checker?: (val: string | undefined) => boolean;
}

export class CmsTextMeta extends TypeMeta<DocumentType.CmsText> {
    readonly type = DocumentType.CmsText;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.CmsText, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.CmsText] {
        return {
            text: ''
        };
    }
}

class CmsText extends iDocument<DocumentType.CmsText> {
    @observable accessor text: string;
    constructor(props: DocumentProps<DocumentType.CmsText>, store: DocumentStore) {
        super(props, store);
        this.text = props.data?.text || '';
    }

    @action
    setData(data: TypeDataMapping[DocumentType.CmsText], from: Source, updatedAt?: Date): void {
        this.text = data.text;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.CmsText] {
        return {
            text: this.text
        };
    }

    @computed
    get meta(): CmsTextMeta {
        if (this.root?.type === DocumentType.CmsText) {
            return this.root.meta as CmsTextMeta;
        }
        return new CmsTextMeta({});
    }
}

export default CmsText;
