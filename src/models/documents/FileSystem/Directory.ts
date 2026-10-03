import { Document as DocumentProps, DocumentType } from '@tdev-api/document';
import { formatDateTime } from '@tdev-models/helpers/date';
import DocumentStore from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit/array';
import { action, computed } from 'mobx';
import File from './File';
import iFileSystem, { DefaultName, iFSMeta, isFileSystemType, MetaInit } from './iFileSystem';

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
    get files(): File[] {
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
    get directories(): Directory[] {
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
        const basePath = `${this.name || this.id}/`;
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

    @action
    createDir(name?: string): Promise<Directory | void> {
        const defaultName = name || DefaultName['dir'];
        const existingNames = new Set([...this.directories, ...this.files].map((f) => f.name));
        let nr = 0;
        while (existingNames.has(`${defaultName} ${nr > 0 ? ` (${nr})` : ''}`)) {
            nr++;
        }
        return this.store.create({
            documentRootId: this.documentRootId,
            parentId: this.id,
            type: 'dir',
            data: {
                name: `${defaultName} ${nr > 0 ? ` (${nr})` : ''}`,
                isOpen: true
            }
        });
    }

    @action
    createFile(type: DocumentType, name?: string): Promise<File | void> {
        const defaultName = name || 'new-file';
        const configs = this.store.fileExtensions.get(type);
        if (!configs) {
            console.error(`No file configuration found for type ${type}`);
            return Promise.resolve();
        }
        const fileConfigs = Array.isArray(configs) ? configs : [configs];
        const extensions = fileConfigs.map((c) => c.extension);
        let extension = defaultName.includes('.')
            ? `.${defaultName.split('.').pop()!.toLowerCase()}`
            : extensions[0] || '';
        if (!extensions.includes(extension)) {
            extension = extensions[0] || '';
        }
        const fileConfig = fileConfigs.find((c) => c.extension === extension) || fileConfigs[0];
        const existingNames = new Set([...this.directories, ...this.files].map((f) => f.name));
        let nr = 0;
        const baseName = defaultName.endsWith(extension)
            ? defaultName.slice(0, -extension.length)
            : defaultName;
        const getName = (nr: number) => `${baseName}${nr > 0 ? ` (${nr})` : ''}${extension}`;

        while (extensions.some((e) => existingNames.has(getName(nr)))) {
            nr++;
        }

        return this.store
            .create({
                documentRootId: this.documentRootId,
                parentId: this.id,
                type: 'file',
                data: {
                    isOpen: true,
                    name: getName(nr)
                }
            })
            .then((file) => {
                if (!file) {
                    return;
                }
                return this.store.create({
                    documentRootId: this.documentRootId,
                    parentId: file.id,
                    type: type,
                    data: {
                        ...(fileConfig.defaultData ?? {})
                    }
                });
            })
            .then((doc) => {
                if (!doc) {
                    return;
                }
                console.log('Created file', doc.data);
                return doc.parent as File;
            });
    }
}

export default Directory;
