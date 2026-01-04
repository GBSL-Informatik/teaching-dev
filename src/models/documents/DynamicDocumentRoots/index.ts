import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    ContainerType,
    ContainerTypeModelMapping
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import { v4 as uuidv4 } from 'uuid';
import { ContainerMeta } from './ContainerMeta';

export interface MetaInit<Type extends ContainerType> {
    containerType: Type;
    readonly?: boolean;
}

export class ModelMeta<Type extends ContainerType> extends TypeMeta<'dynamic_document_roots'> {
    readonly type = 'dynamic_document_roots';
    readonly containerType: Type;

    constructor(props: MetaInit<Type>) {
        super('dynamic_document_roots', props.readonly ? Access.RO_User : undefined);
        this.containerType = props.containerType;
    }

    get defaultData(): TypeDataMapping['dynamic_document_roots'] {
        return {
            containerType: this.containerType,
            documentRootIds: []
        };
    }
}

class DynamicDocumentRoots<Type extends ContainerType> extends iDocument<'dynamic_document_roots'> {
    readonly type = 'dynamic_document_roots';
    documentRootIds = observable.set<string>([]);
    readonly containerType: Type;

    constructor(props: DocumentProps<'dynamic_document_roots'>, store: DocumentStore) {
        super(props, store);
        this.documentRootIds.replace(props.data.documentRootIds);
        this.containerType = props.data.containerType;
    }

    @action
    setData(
        data: Pick<TypeDataMapping['dynamic_document_roots'], 'documentRootIds'> &
            Partial<TypeDataMapping['dynamic_document_roots']>,
        from: Source,
        updatedAt?: Date
    ): void {
        if (!data) {
            return;
        }
        this.documentRootIds.replace(data.documentRootIds.filter((id) => id !== this.id));
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get defaultContainerMeta(): ContainerMeta<Type> {
        const component = this.store.root.componentStore.getComponent(this.containerType);
        if (!component) {
            return new ContainerMeta(this.containerType);
        }
        return component.defaultMeta;
    }

    @action
    addDynamicDocumentRoot() {
        const id = uuidv4();
        const meta = this.defaultContainerMeta;
        this.store.root.documentRootStore
            .create(id, new ContainerMeta(this.containerType), {
                access: Access.None_DocumentRoot,
                sharedAccess: Access.RO_DocumentRoot
            })
            .then(
                action((dynRoot) => {
                    this.setData(
                        {
                            documentRootIds: [...this.documentRootIds, dynRoot.id]
                        },
                        Source.API,
                        new Date()
                    );
                    const onFailure = () => {
                        console.log('Failed to create dynamic document root');
                        const createdDynDoc = this.store.root.documentRootStore.find(id);
                        if (createdDynDoc) {
                            this.store.root.documentRootStore.destroy(createdDynDoc).then((success) => {
                                if (!success) {
                                    console.error('Failed to remove dynamic document root');
                                }
                            });
                        }
                    };
                    return this.saveNow().then((isSaved) => {
                        if (isSaved) {
                            this.store
                                .create({
                                    documentRootId: id,
                                    type: this.containerType,
                                    data: meta.defaultData
                                })
                                .then((createdDoc) => {
                                    if (!createdDoc) {
                                        onFailure();
                                    }
                                });
                        } else {
                            onFailure();
                        }
                    });
                })
            );
    }

    @action
    removeDynamicDocumentRoot(id: string) {
        if (!this.documentRootIds.has(id)) {
            return;
        }
        const linkedRoot = this.linkedDynamicDocumentRoots.find((dr) => dr.id === id);
        /** first remove the doc root from the state, otherwise it will be recreated immediately... */
        this.setData(
            {
                documentRootIds: [...this.documentRootIds].filter((did) => did !== id)
            },
            Source.API,
            new Date()
        );
        this.saveNow().then(() => {
            if (linkedRoot) {
                this.store.root.documentRootStore.destroy(linkedRoot).then((success) => {
                    if (!success) {
                        /** undo the removal */
                        this.setData(
                            {
                                documentRootIds: [...this.documentRootIds, id]
                            },
                            Source.LOCAL,
                            new Date()
                        );
                    }
                });
            }
        });
    }

    @action
    loadDocumentRoots() {
        return [...this.documentRootIds].map((id) => {
            this.store.root.documentRootStore.loadInNextBatch(id, this.defaultContainerMeta);
        });
    }

    get data(): TypeDataMapping['dynamic_document_roots'] {
        return {
            containerType: this.containerType,
            documentRootIds: [...this.documentRootIds]
        };
    }

    @computed
    get linkedDynamicDocumentRoots(): DocumentRoot<Type>[] {
        return [...this.documentRootIds]
            .map((did) => this.store.root.documentRootStore.find<Type>(did))
            .filter((d) => !!d);
    }

    @computed
    get linkedDocumentContainers(): ContainerTypeModelMapping[Type][] {
        return this.linkedDynamicDocumentRoots
            .flatMap((dr) => dr.firstMainDocument as ContainerTypeModelMapping[Type] | undefined)
            .filter((d) => !!d);
    }

    @computed
    get linkedDocumentContainersMap(): Map<string, ContainerTypeModelMapping[Type]> {
        return new Map<string, ContainerTypeModelMapping[Type]>(
            this.linkedDynamicDocumentRoots.map((dr) => [
                dr.id,
                dr.firstMainDocument as ContainerTypeModelMapping[Type]
            ])
        );
    }

    @computed
    get meta(): ModelMeta<ContainerType> {
        if (this.root?.type === 'dynamic_document_roots') {
            return this.root.meta as ModelMeta<ContainerType>;
        }
        return new ModelMeta({ containerType: this.containerType });
    }
}

export default DynamicDocumentRoots;
