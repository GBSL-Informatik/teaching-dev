import { action, computed } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    DynamicDocumentRoot as DynamicDocumentRootProps,
    TypeDataMapping,
    Access,
    RoomType
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import DynamicDocumentRoots from './DynamicDocumentRoots';
import DynamicRoom from './DynamicRooms';
import CircuitRoom from '@tdev/circuit/models/CircuitRoom';

export interface MetaInit<T extends RoomType> {
    readonly?: boolean;
    roomType: T;
}

interface RoomMapping {
    [RoomType.Circuit]: CircuitRoom;
    [RoomType.Messages]: DynamicRoom<RoomType.Messages>;
}

function CreateRoomModel<T extends RoomType>(
    docRoot: DynamicDocumentRoot<T>,
    documentStore: DocumentStore
): RoomMapping[T];
function CreateRoomModel(
    docRoot: DynamicDocumentRoot<RoomType>,
    documentStore: DocumentStore
): RoomMapping[RoomType] {
    switch (docRoot.roomType) {
        case RoomType.Messages:
            return new DynamicRoom(docRoot as DynamicDocumentRoot<RoomType.Messages>, documentStore);
        case RoomType.Circuit:
            return new CircuitRoom(docRoot as DynamicDocumentRoot<RoomType.Circuit>, documentStore);
        // Add more cases as needed
    }
}

class DynamicDocumentRoot<T extends RoomType> extends TypeMeta<DocumentType.DynamicDocumentRoot> {
    readonly type = DocumentType.DynamicDocumentRoot;
    readonly store: DocumentStore;
    readonly rootDocumentId: string;
    readonly parentDocumentId: string;
    readonly roomType: T;
    readonly room: RoomMapping[T];

    constructor(
        props: MetaInit<T>,
        rootDocumentId: string,
        parentDocumentId: string,
        documentStore: DocumentStore
    ) {
        super(DocumentType.DynamicDocumentRoot, props.readonly ? Access.RO_User : undefined);
        this.roomType = props.roomType;
        this.store = documentStore;
        this.rootDocumentId = rootDocumentId;
        this.parentDocumentId = parentDocumentId;
        this.room = CreateRoomModel(this, documentStore);
    }

    @computed
    get parentDocument(): DynamicDocumentRoots | undefined {
        return this.store.find(this.parentDocumentId) as DynamicDocumentRoots;
    }

    @computed
    get props(): DynamicDocumentRootProps | undefined {
        return this.parentDocument?.dynamicDocumentRoots.find((ddr) => ddr.id === this.rootDocumentId);
    }

    @computed
    get parentRoot(): DocumentRoot<DocumentType.DynamicDocumentRoots> | undefined {
        return this.parentDocument?.root as DocumentRoot<DocumentType.DynamicDocumentRoots>;
    }

    @computed
    get name(): string {
        if (!this.parentDocument) {
            return 'Dynamische Document Root';
        }
        const title = this.props?.name;
        return title === undefined ? 'Dynamische Document Root' : title;
    }

    @action
    destroy(): void {
        this.parentDocument?.removeDynamicDocumentRoot(this.rootDocumentId);
    }

    @action
    setName(name: string): void {
        if (!this.parentDocument) {
            return;
        }
        this.parentDocument.setName(this.rootDocumentId, name);
        this.parentDocument.saveNow();
    }

    @action
    setRoomType(type: RoomType): void {
        if (!this.parentDocument) {
            return;
        }
        this.parentDocument.setRoomType(type);
        this.parentDocument.saveNow();
    }

    get defaultData(): TypeDataMapping[DocumentType.DynamicDocumentRoot] {
        return {};
    }
}

export class DynamicDocumentRootModel extends iDocument<DocumentType.DynamicDocumentRoot> {
    constructor(props: DocumentProps<DocumentType.DynamicDocumentRoot>, store: DocumentStore) {
        super(props, store);
        throw new Error('Model not implemented.');
    }

    @action
    setData(data: TypeDataMapping[DocumentType.DynamicDocumentRoot], from: Source, updatedAt?: Date): void {
        throw new Error('Method not implemented.');
    }

    get data(): TypeDataMapping[DocumentType.DynamicDocumentRoot] {
        return {};
    }

    @computed
    get meta(): DynamicDocumentRoot<RoomType> {
        throw new Error('Method not implemented.');
    }
}

export default DynamicDocumentRoot;
