import { RootStore } from './rootStore';
import type DocumentRoot from '@tdev-models/DocumentRoot';
import { DynamicDocumentRoot } from '@tdev-api/document';
import type { RoomType } from '@tdev-api/document';

interface RoomComponent {
    name: string;
    description: string;
    component: React.ComponentType<{
        documentRoot: DocumentRoot<'dynamic_document_root'>;
        roomProps: DynamicDocumentRoot;
    }>;
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
