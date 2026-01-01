import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    DynamicDocumentRoot,
    RoomType
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import { default as DynamicDocRootMeta } from '@tdev-models/documents/DynamicDocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    roomType: RoomType;
}

export class ModelMeta extends TypeMeta<'dynamic_document_roots'> {
    readonly type = 'dynamic_document_roots';
    readonly roomType: RoomType;

    constructor(props: MetaInit) {
        super('dynamic_document_roots', props.readonly ? Access.RO_User : undefined);
        this.roomType = props.roomType;
    }

    get defaultData(): TypeDataMapping['dynamic_document_roots'] {
        return {
            roomType: this.roomType,
            documentRoots: []
        };
    }
}

class DynamicDocumentRoots extends iDocument<'dynamic_document_roots'> {
    readonly type = 'dynamic_document_roots';
    dynamicDocumentRoots = observable.array<DynamicDocumentRoot>([]);
    @observable accessor roomType: RoomType;

    constructor(props: DocumentProps<'dynamic_document_roots'>, store: DocumentStore) {
        super(props, store);
        this.dynamicDocumentRoots.replace(props.data.documentRoots);
        this.roomType = props.data.roomType;
    }

    @action
    setData(data: TypeDataMapping['dynamic_document_roots'], from: Source, updatedAt?: Date): void {
        if (!data) {
            return;
        }
        this.dynamicDocumentRoots.replace(data.documentRoots);
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    setName(id: string, name: string) {
        const current = this.dynamicDocumentRoots.find((dr) => dr.id === id);
        if (!current) {
            return;
        }
        const renamedRoots = [
            { ...current, name: name },
            ...this.dynamicDocumentRoots.filter((dr) => dr.id !== id)
        ];
        this.setData({ roomType: this.roomType, documentRoots: renamedRoots }, Source.LOCAL, new Date());
    }

    @computed
    get canChangeType() {
        return this.linkedDynamicDocumentRoots.every((dr) => dr.allDocuments.length === 0);
    }

    @action
    setRoomType(roomType: RoomType) {
        if (!this.canChangeType) {
            return;
        }
        this.setData(
            { roomType: roomType, documentRoots: this.dynamicDocumentRoots.slice() },
            Source.LOCAL,
            new Date()
        );
    }

    containsDynamicDocumentRoot(id: string): boolean {
        return this.dynamicDocumentRoots.some((dr) => dr.id === id);
    }

    @action
    addDynamicDocumentRoot(id: string, name: string) {
        this.store.root.documentRootStore
            .create(
                id,
                new DynamicDocRootMeta(
                    { roomType: this.roomType },
                    id,
                    this.id,
                    this.store.root.documentStore
                ),
                {
                    access: Access.None_DocumentRoot,
                    sharedAccess: Access.RO_DocumentRoot
                }
            )
            .then(
                action((dynRoot) => {
                    this.setData(
                        {
                            roomType: this.roomType,
                            documentRoots: [...this.dynamicDocumentRoots, { id: id, name: name }]
                        },
                        Source.LOCAL,
                        new Date()
                    );
                    return this.saveNow();
                })
            )
            .catch((e) => {
                console.log('Failed to create dynamic document root', e);
                const createdDynDoc = this.store.root.documentRootStore.find(id);
                if (createdDynDoc) {
                    this.store.root.documentRootStore.destroy(createdDynDoc).then((success) => {
                        if (!success) {
                            console.error('Failed to remove dynamic document root');
                        }
                    });
                }
            });
    }

    @action
    removeDynamicDocumentRoot(id: string) {
        const ddRoot = this.dynamicDocumentRoots.find((dr) => dr.id === id);
        if (!ddRoot) {
            return;
        }
        const linkedRoot = this.linkedDynamicDocumentRoots.find((dr) => dr.id === id);
        /** first remove the doc root from the state, otherwise it will be recreated immediately... */
        this.setData(
            {
                roomType: this.roomType,
                documentRoots: this.dynamicDocumentRoots.filter((dr) => dr.id !== id)
            },
            Source.LOCAL,
            new Date()
        );
        this.saveNow().then(() => {
            if (linkedRoot) {
                this.store.root.documentRootStore.destroy(linkedRoot).then((success) => {
                    if (!success) {
                        /** undo the removal */
                        this.setData(
                            {
                                roomType: this.roomType,
                                documentRoots: [...this.dynamicDocumentRoots, ddRoot]
                            },
                            Source.LOCAL,
                            new Date()
                        );
                    }
                });
            }
        });
    }

    get data(): TypeDataMapping['dynamic_document_roots'] {
        return {
            roomType: this.roomType,
            documentRoots: this.dynamicDocumentRoots.map((dr) => ({ ...dr }))
        };
    }

    @computed
    get linkedDynamicDocumentRoots(): DocumentRoot<'dynamic_document_root'>[] {
        return this.dynamicDocumentRoots
            .map((dr) => this.store.root.documentRootStore.find<'dynamic_document_root'>(dr.id))
            .filter((d) => !!d);
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'dynamic_document_roots') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({ roomType: this.roomType });
    }
}

export default DynamicDocumentRoots;
