import { type DocumentModelType, Document as DocumentProps, DocumentType } from '@tdev-api/document';
import { formatDateTime } from '@tdev-models/helpers/date';
import { FileConfig, findFileConfig } from '@tdev-stores/assets/FileExtensions';
import DocumentStore from '@tdev-stores/DocumentStore';
import { computed } from 'mobx';
import iFileSystem, { DefaultName, iFSMeta, MetaInit } from './iFileSystem';

export class ModelMeta extends iFSMeta<'file'> {
    constructor(props: Partial<MetaInit>) {
        super('file', props);
    }
}

class File extends iFileSystem<'file'> {
    constructor(props: DocumentProps<'file'>, store: DocumentStore) {
        super(props, store);
        this._name =
            props.data?.name || this.meta?.name || `${DefaultName[this.type]} ${formatDateTime(new Date())}`;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'file') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    /**
     * The registered file type of this file, e.g. to show its icon.
     */
    @computed
    get fileConfig(): FileConfig<DocumentType> | undefined {
        if (!this.document) {
            return undefined;
        }
        const configs = this.store.fileExtensions.get(this.document.type) ?? [];
        return findFileConfig(configs, this.name);
    }

    /**
     * The extension of the registered file type, lower case and without the dot.
     */
    @computed
    get fileExtension(): string {
        return this.fileConfig?.extension.toLowerCase().replace(/^\./, '') ?? '';
    }

    @computed
    get document(): DocumentModelType | undefined {
        return this.children.find((d) => d.uniqOnParent === 'file') ?? this.children[0];
    }
}

export default File;
