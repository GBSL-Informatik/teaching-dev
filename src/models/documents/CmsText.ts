import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    default?: string;
}

export class CmsTextMeta extends TypeMeta<'cms_text'> {
    readonly type = 'cms_text';
    readonly default: string;

    constructor(props: Partial<MetaInit>) {
        super('cms_text', undefined);
        this.default = props.default ?? '';
    }

    get defaultData(): TypeDataMapping['cms_text'] {
        return {
            text: this.default
        };
    }
}

class CmsText extends iDocument<'cms_text'> {
    @observable accessor text: string;
    constructor(props: DocumentProps<'cms_text'>, store: DocumentStore) {
        super(props, store);
        this.text = props.data?.text || '';
    }

    @action
    setData(data: TypeDataMapping['cms_text'], from: Source, updatedAt?: Date): void {
        this.text = data.text;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['cms_text'] {
        return {
            text: this.text
        };
    }

    @computed
    get meta(): CmsTextMeta {
        if (this.root?.type === 'cms_text') {
            return this.root.meta as CmsTextMeta;
        }
        return new CmsTextMeta({});
    }

    /**
     * for now, only admins can edit cms texts
     */
    @computed
    get canEdit(): boolean {
        return !!this.store.root.userStore.current?.hasElevatedAccess;
    }
}

export default CmsText;
