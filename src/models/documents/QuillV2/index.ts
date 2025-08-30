import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { getToolbar, TOOLBAR, ToolbarModule, ToolbarOptions } from './helpers/toolbar';
import { Delta } from 'quill/core';
import { ApiState } from '@tdev-stores/iStore';
import _ from 'es-toolkit/compat';

export interface MetaInit {
    readonly?: boolean;
    toolbar?: ToolbarOptions;
    toolbarExtra?: ToolbarOptions;
    placeholder?: string;
    default?: string;
}

export class ModelMeta extends TypeMeta<DocumentType.QuillV2> {
    readonly type = DocumentType.QuillV2;
    readonly toolbar: ToolbarModule;
    readonly placeholder: string;
    readonly default: string;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.QuillV2, props.readonly ? Access.RO_User : undefined);
        this.default = `${props.default || ''}\n` || '\n';
        this.toolbar = props.toolbar
            ? getToolbar(props.toolbar)
            : [...TOOLBAR, ...getToolbar(props.toolbarExtra || {})];
        this.placeholder = props.placeholder || '✍️ Antwort...';
    }

    get defaultData(): TypeDataMapping[DocumentType.QuillV2] {
        return {
            delta: { ops: [{ insert: this.default }] } as Delta
        };
    }
}

class QuillV2 extends iDocument<DocumentType.QuillV2> {
    @observable.ref accessor delta: Delta;

    constructor(props: DocumentProps<DocumentType.QuillV2>, store: DocumentStore) {
        super(props, store);
        this.delta = props.data.delta;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.QuillV2], from: Source, updatedAt?: Date): void {
        this.delta = data.delta;
        if (from === Source.LOCAL) {
            this.save();
        } else {
            this.state = ApiState.SYNCING;
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.QuillV2] {
        return {
            delta: this.delta
        };
    }

    @action
    setDelta(delta: Delta): void {
        this.setData({ delta }, Source.LOCAL);
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.QuillV2) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get isDirty(): boolean {
        return !_.isEqual(this.delta, this._pristine.delta);
    }
}

export default QuillV2;
