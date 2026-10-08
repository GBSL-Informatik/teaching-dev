import { Document as DocumentProps, DocumentType } from '@tdev-api/document';
import { formatDateTime } from '@tdev-models/helpers/date';
import DocumentStore, { FileConfig } from '@tdev-stores/DocumentStore';
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
        this._name =
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
    get expandedPaths(): string[] {
        return this.directories.reduce((acc, d) => {
            if (d.isOpen) {
                return [...acc, d.filePath, ...d.expandedPaths];
            }
            return acc;
        }, [] as string[]);
    }

    @computed
    get allItems(): iFileSystem[] {
        const files = this.root?.documents.filter(
            (d) => isFileSystemType(d) && d.filePath.startsWith(this.filePath)
        ) as iFileSystem[];
        return orderBy(files || [], ['filePath'], ['asc']);
    }

    @computed
    get allFiles(): File[] {
        return this.allItems.filter((f) => f.type === 'file') as File[];
    }

    @computed
    get allDirectories(): Directory[] {
        return this.allItems.filter((f) => f.type === 'dir') as Directory[];
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
    get selectedFiles(): File[] {
        return this.allItems.filter((f) => f.type === 'file' && f.isOpen) as File[];
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
        const basePath = this.parent ? `${this.name}/` : '';
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
        const directoryName = this.getUniqueName(defaultName);
        return this.store.create({
            documentRootId: this.documentRootId,
            parentId: this.id,
            type: 'dir',
            data: {
                name: directoryName,
                isOpen: true
            }
        });
    }

    @action
    async createFile(type: DocumentType, name?: string): Promise<File | void> {
        const requestedName = name || 'new-file';
        const fileConfig = this.findFileConfig(type, requestedName);
        if (!fileConfig) {
            throw new Error('Dieser Dateityp kann nicht erstellt werden.');
        }

        const fileName = this.getUniqueFileName(requestedName, fileConfig.extension);
        const file = await this.createFileContainer(fileName);
        if (!file) {
            throw new Error('Die Datei konnte nicht erstellt werden.');
        }

        try {
            const document = await this.createFileContent(file.id, type, fileConfig);
            if (!document) {
                throw new Error('Der Dateiinhalt konnte nicht erstellt werden.');
            }
            return document.parent as File;
        } catch (error) {
            const removed = await this.store.apiDelete(file).catch(() => false);
            if (!removed) {
                throw new Error(
                    'Der Dateiinhalt konnte nicht erstellt werden. Die leere Datei konnte nicht entfernt werden. Bitte lösche sie nach dem Wiederverbinden.',
                    { cause: error }
                );
            }
            throw error;
        }
    }

    private findFileConfig(type: DocumentType, requestedName: string): FileConfig<DocumentType> | undefined {
        const fileConfigs = this.store.fileExtensions.get(type) ?? [];
        if (fileConfigs.length === 0) {
            console.error(`No file configuration found for type ${type}`);
            return;
        }

        const requestedExtension = requestedName.includes('.')
            ? `.${requestedName.split('.').pop()!.toLowerCase()}`
            : '';
        return (
            fileConfigs.find((config) => config.extension.toLowerCase() === requestedExtension) ??
            fileConfigs[0]
        );
    }

    private getUniqueFileName(requestedName: string, extension: string): string {
        const baseName =
            extension && requestedName.toLowerCase().endsWith(extension.toLowerCase())
                ? requestedName.slice(0, -extension.length)
                : requestedName;

        return this.getUniqueName(baseName, extension);
    }

    private getUniqueName(baseName: string, extension: string = ''): string {
        const existingNames = new Set([...this.directories, ...this.files].map((item) => item.name));
        let suffix = 0;
        let uniqueName = `${baseName}${extension}`;

        while (existingNames.has(uniqueName)) {
            suffix++;
            uniqueName = `${baseName} (${suffix})${extension}`;
        }
        return uniqueName;
    }

    private createFileContainer(fileName: string) {
        return this.store.create({
            documentRootId: this.documentRootId,
            parentId: this.id,
            type: 'file',
            data: {
                isOpen: true,
                name: fileName
            }
        });
    }

    private createFileContent(fileId: string, type: DocumentType, fileConfig: FileConfig<DocumentType>) {
        return this.store.create({
            documentRootId: this.documentRootId,
            parentId: fileId,
            type,
            data: {
                ...(fileConfig.defaultData ?? {})
            }
        });
    }
}

export default Directory;
