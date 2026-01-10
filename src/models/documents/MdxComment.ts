import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    Document as DocumentProps,
    TypeDataMapping,
    MdxCommentData,
    DocumentModelType
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Color } from '@tdev-components/shared/Colors';

export interface MetaInit extends MdxCommentData {}

export class ModelMeta extends TypeMeta<'mdx_comment'> {
    readonly type = 'mdx_comment';
    readonly nr: number;
    readonly commentNr: number;
    readonly nodeType: string;

    constructor(props: Partial<MetaInit>) {
        super('mdx_comment');
        this.nr = props.nr || 0;
        this.commentNr = props.commentNr || 0;
        this.nodeType = props.type || '';
    }

    get defaultData(): TypeDataMapping['mdx_comment'] {
        return {
            type: this.nodeType,
            nr: this.nr,
            commentNr: this.commentNr,
            isOpen: true,
            color: 'blue'
        };
    }
}

class MdxComment extends iDocument<'mdx_comment'> {
    @observable accessor nodeType: string;
    @observable accessor nr: number;
    @observable accessor commentNr: number;
    @observable accessor isOpen: boolean;
    @observable accessor color: Color;

    @observable accessor optionsOpen: boolean = false;

    constructor(props: DocumentProps<'mdx_comment'>, store: DocumentStore) {
        super(props, store);
        this.nr = props.data.nr;
        this.commentNr = props.data.commentNr;
        this.nodeType = props.data.type;
        this.isOpen = props.data.isOpen;
        this.color = props.data.color;
    }

    @action
    setData(data: TypeDataMapping['mdx_comment'], from: Source, updatedAt?: Date): void {
        this.nr = data.nr;
        this.commentNr = data.commentNr;
        this.nodeType = data.type;
        this.color = data.color;
        this.isOpen = data.isOpen;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['mdx_comment'] {
        return {
            nr: this.nr,
            commentNr: this.commentNr,
            type: this.nodeType,
            isOpen: this.isOpen,
            color: this.color
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'mdx_comment') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @action
    setIsOpen(isOpen: boolean) {
        this.isOpen = isOpen;
        this.save();
    }

    @action
    setColor(color: Color) {
        this.color = color;
        this.save();
    }

    @action
    setOptionsOpen(open: boolean) {
        this.optionsOpen = open;
    }

    @action
    delete() {
        return this.store.apiDelete(this as any as DocumentModelType);
    }
}

export default MdxComment;
