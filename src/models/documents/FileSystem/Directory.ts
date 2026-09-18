import { computed } from 'mobx';
import { Document as DocumentProps } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import _ from 'es-toolkit/compat';
import { orderBy } from 'es-toolkit/array';
import File from './File';
import iFileSystem, { DefaultName, iFSMeta, isFileSystemType, MetaInit } from './iFileSystem';
import { formatDateTime } from '@tdev-models/helpers/date';

export class ModelMeta extends iFSMeta<'dir'> {
    constructor(props: Partial<MetaInit>) {
        super('dir', props);
    }
}

class Directory extends iFileSystem<'dir'> {
    constructor(props: DocumentProps<'dir'>, store: DocumentStore) {
        super(props, store);
        this.name =
            props.data?.name || this.meta?.name || `${DefaultName[this.type]} ${formatDateTime(new Date())}`;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'dir') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get allFiles(): iFileSystem[] {
        const files = this.root?.documents.filter(
            (d) => isFileSystemType(d) && d.filePath.startsWith(this.filePath)
        ) as iFileSystem[];
        return orderBy(files || [], ['filePath'], ['asc']);
    }

    @computed
    get files() {
        if (!this.root) {
            return [];
        }
        return orderBy(
            this.root.documents.filter((d) => d.parentId === this.id && d.type === 'file') as File[],
            [(f) => `${f.name}`],
            ['asc']
        );
    }

    @computed
    get directories() {
        if (!this.root) {
            return [];
        }
        return orderBy(
            this.root.documents.filter((d) => d.parentId === this.id && d.type === 'dir') as Directory[],
            [(d) => `${d.name}`],
            ['asc']
        );
    }

    @computed
    get fileTree(): string[] {
        // returns relative to self path all files having the current directory as parent.
        const basePath = this.parentId ? `${this.name || this.id}/` : '';
        const directoryTrees = this.directories.flatMap((d) => {
            return d.fileTree.map((p) => `${basePath}${p}`);
        });
        const filePaths = this.files.map((f) => `${basePath}${f.name || f.id}`);
        const n = directoryTrees.length + filePaths.length;
        if (n === 0) {
            return [basePath];
        }
        return [...directoryTrees, ...filePaths];
    }
}

export default Directory;
