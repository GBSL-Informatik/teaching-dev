import { DocumentModelType, Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { formatDateTime } from '@tdev-models/helpers/date';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';

export interface MetaInit {
    readonly?: boolean;
    name?: string;
}

type SystemType = 'file' | 'dir';

export const DefaultName: Record<SystemType, string> = {
    ['file']: 'Dokument',
    ['dir']: 'Ordner'
};

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
    @observable accessor _name: string;
    @observable accessor isOpen: boolean = true;
    @observable accessor isEditing: boolean = false;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this._name = props.data?.name || `${DefaultName[this.type]} ${formatDateTime(new Date())}`;
        this.isOpen = props.data?.isOpen ?? true;
    }

    @computed
    get name(): string {
        if (!this.isUniqueName) {
            return `${this._name}:${this.id.slice(0, 8)}`;
        }
        return this._name;
    }

    @computed
    get isUniqueName(): boolean {
        if (!this.parent) {
            return true;
        }
        const siblings = this.parent.children.filter((c) => c.id !== this.id && c.type === this.type);
        return !siblings.some((s) => (s as iFileSystem)._name === this._name);
    }

    @action
    setData(
        data: Partial<TypeDataMapping['file'] | TypeDataMapping['dir']>,
        from: Source,
        updatedAt?: Date
    ): void {
        if (data.name !== undefined) {
            this._name = data.name;
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
            name: this._name,
            isOpen: this.isOpen
        };
    }

    abstract get meta(): iFSMeta<T>;

    @computed
    get filePath(): string {
        if (!this.parentId) {
            if (this.type === 'dir') {
                return `${this.name || this.id}/`;
            }
            return this.name;
        }
        const name = this.type === 'dir' ? `${this.name}/` : this.name;
        if (this.parent?.type !== 'dir') {
            return name;
        }
        // const duplicates = (this.parent as Directory).children.filter(
        //     (c) => c.id !== this.id && c.type === this.type && c.name === this.name
        // );
        // const sanitizedName = duplicates.length > 0 ? `${this.name}:${this.id.slice(0, 8)}` : this.name;
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
        const sanitized = name.replace(/:[a-f0-9]{8}$/g, '');
        if (sanitized.trim() === this._name || sanitized.trim() === '') {
            return;
        }
        this.setData({ name: name.trim() }, Source.LOCAL, new Date());
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
