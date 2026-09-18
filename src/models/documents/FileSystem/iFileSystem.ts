import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    Document as DocumentProps,
    TypeDataMapping,
    DocumentType,
    DocumentModelType
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { formatDateTime } from '@tdev-models/helpers/date';
import _ from 'es-toolkit/compat';

export interface MetaInit {
    readonly?: boolean;
    name?: string;
}

type SystemType = 'file' | 'dir';

export const DefaultName: Record<SystemType, string> = {
    ['file']: 'Dokument',
    ['dir']: 'Ordner'
};

export const SystemDocumentTypes: SystemType[] = Object.keys(DefaultName) as SystemType[];

export class iFSMeta<T extends SystemType> extends TypeMeta<T> {
    readonly readonly?: boolean;
    readonly name: string;
    constructor(type: T, props: Partial<MetaInit>) {
        super(type, props);
        this.readonly = props.readonly;
        this.name = props.name || `${DefaultName[type]} ${formatDateTime(new Date())}`;
    }

    @computed
    get defaultData(): TypeDataMapping[T] {
        return {
            name: this.name,
            isOpen: true
        };
    }
}

abstract class iFileSystem<T extends SystemType = SystemType> extends iDocument<T> {
    @observable accessor name: string;
    @observable accessor isOpen: boolean = true;
    @observable accessor isEditing: boolean = false;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this.name = props.data?.name || `${DefaultName[this.type]} ${formatDateTime(new Date())}`;
        this.isOpen = props.data?.isOpen ?? true;
    }

    @action
    setData(
        data: Partial<TypeDataMapping['file'] | TypeDataMapping['dir']>,
        from: Source,
        updatedAt?: Date
    ): void {
        if (data.name !== undefined) {
            this.name = data.name;
        }
        if (data.isOpen !== undefined) {
            this.isOpen = data.isOpen;
        }
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[T] {
        return {
            name: this.name,
            isOpen: this.isOpen
        };
    }

    abstract get meta(): iFSMeta<T>;

    @computed
    get filePath(): string {
        if (!this.parentId) {
            if (this.type === 'dir') {
                return '';
            }
            return this.name;
        }
        const name = this.type === 'dir' ? `${this.name}/` : this.name;
        if (this.parent?.type !== 'dir') {
            return name;
        }
        const basePath = this.parent.filePath ? this.parent.filePath : '';
        return `${basePath}${name}`;
    }

    @computed
    get basePath(): string {
        if (!this.parentId) {
            return '';
        }
        if (this.parent?.type !== 'dir') {
            return '';
        }
        return this.parent.filePath;
    }

    @computed
    get path(): DocumentModelType[] {
        const path: DocumentModelType[] = [];
        let parent = this.parent;
        while (parent) {
            path.unshift(parent);
            parent = parent.parent;
        }
        return path;
    }

    @action
    setIsEditing(isEditing: boolean) {
        this.isEditing = isEditing;
    }

    @action
    setIsOpen(isOpen: boolean) {
        if (this.isOpen === isOpen) {
            return;
        }
        this.setData({ isOpen: isOpen }, Source.LOCAL, new Date());
        this.saveNow();
    }

    @action
    setName(name: string) {
        this.setData({ name: name }, Source.LOCAL, new Date());
    }

    @action
    delete() {
        return this.store.apiDelete(this as unknown as DocumentModelType);
    }
}

export const isFileSystemType = (doc: iDocument<any>): doc is iFileSystem => {
    return doc.type === 'file' || doc.type === 'dir';
};

export default iFileSystem;
