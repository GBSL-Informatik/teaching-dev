import { type DocumentModelType, Document as DocumentProps, DocumentType } from '@tdev-api/document';
import { formatDateTime } from '@tdev-models/helpers/date';
import { FileConfig } from '@tdev-stores/assets/FileExtensions';
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

    @computed
    get allowedFileExtensions() {
        if (!this.document || !this.store.fileExtensions.has(this.document.type)) {
            return [];
        }
        const configs = this.store.fileExtensions.get(this.document.type)!;
        return configs.map((c) => c.extension.toLowerCase().replace(/^\./, ''));
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
        const extension = this.fileExtension;
        return configs.find((config) => config.extension.toLowerCase().replace(/^\./, '') === extension);
    }

    @computed
    get fileExtension(): string {
        if (this.allowedFileExtensions.length === 0) {
            return '';
        }
        if (this.allowedFileExtensions.length === 1) {
            return this.allowedFileExtensions[0];
        }
        const parts = this.name.split('.');
        if (parts.length < 2) {
            return this.allowedFileExtensions[0] || '';
        }
        const ext = parts[parts.length - 1].toLowerCase();
        return this.allowedFileExtensions.includes(ext) ? ext : this.allowedFileExtensions[0];
    }

    @computed
    get document(): DocumentModelType | undefined {
        return this.children.find((d) => d.uniqOnParent === 'file') ?? this.children[0];
    }
}

export default File;
