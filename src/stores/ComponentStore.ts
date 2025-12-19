import { RootStore } from './rootStore';
import type DocumentRoot from '@tdev-models/DocumentRoot';
import { DynamicDocumentRoot as ApiDynamicDocumentRoot } from '@tdev-api/document';
import type { RoomType } from '@tdev-api/document';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';

export interface ApiRoomProps {
    documentRoot: DocumentRoot<'dynamic_document_root'>;
    apiRoomProps: ApiDynamicDocumentRoot;
}

export interface DynamicRoomProps<T extends RoomType = RoomType> {
    documentRoot: DocumentRoot<'dynamic_document_root'>;
    dynamicRoot: DynamicDocumentRoot<T>;
}

export interface RoomComponent<T extends RoomType = RoomType> {
    name: string;
    description: string;
    component: React.ComponentType<ApiRoomProps | DynamicRoomProps<T>>;
    default?: boolean;
}

class ComponentStore {
    readonly root: RootStore;
    components = new Map<RoomType, RoomComponent>();

    constructor(root: RootStore) {
        this.root = root;
    }

    registerRoomComponent(type: RoomType, component: RoomComponent) {
        this.components.set(type, component);
    }

    get registeredRoomTypes(): RoomType[] {
        return [...this.components.keys()];
    }

    get defaultRoomType(): RoomType | undefined {
        if (this.components.size === 0) {
            return undefined;
        }
        for (const [type, component] of this.components.entries()) {
            if (component.default) {
                return type;
            }
        }
        return this.components.keys().next().value;
    }

    isValidRoomType(type?: string): type is RoomType {
        if (!type) {
            return false;
        }
        return this.components.has(type as RoomType);
    }
}

export default ComponentStore;
