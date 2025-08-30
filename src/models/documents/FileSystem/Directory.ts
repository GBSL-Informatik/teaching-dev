import { computed } from 'mobx';
import { DocumentType, Document as DocumentProps } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import _ from 'es-toolkit/compat';
import File from './File';
import iFileSystem, { iFSMeta, MetaInit } from './iFileSystem';

export class ModelMeta extends iFSMeta<DocumentType.Dir> {
    constructor(props: Partial<MetaInit>) {
        super(DocumentType.Dir, props);
    }
}

class Directory extends iFileSystem<DocumentType.Dir> {
    constructor(props: DocumentProps<DocumentType.Dir>, store: DocumentStore) {
        super(props, store);
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.Dir) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get files() {
        if (!this.root) {
            return [];
        }
        return _.orderBy(
            this.root.documents.filter(
                (d) => d.parentId === this.id && d.type === DocumentType.File
            ) as File[],
            [(f) => `${f.name}`.replace(/\d+/g, (n) => n.padStart(10, '0'))],
            ['asc']
        );
    }

    @computed
    get directories() {
        if (!this.root) {
            return [];
        }
        return _.orderBy(
            this.root.documents.filter(
                (d) => d.parentId === this.id && d.type === DocumentType.Dir
            ) as Directory[],
            [(d) => `${d.name}`.replace(/\d+/g, (n) => n.padStart(10, '0'))],
            ['asc']
        );
    }
}

export default Directory;
