import { RootStore } from './rootStore';
import type { ContainerType, ContainerTypeModelMapping } from '@tdev-api/document';
import { ContainerMeta } from '@tdev-models/documents/DynamicDocumentRoots/ContainerMeta';

export interface ContainerProps<T extends ContainerType = ContainerType> {
    documentContainer: ContainerTypeModelMapping[T];
}

export interface ContainerComponent<T extends ContainerType = ContainerType> {
    defaultMeta: ContainerMeta<T>;
    component: React.ComponentType<ContainerProps<T>>;
}

class ComponentStore {
    readonly root: RootStore;
    components = new Map<ContainerType, ContainerComponent>();

    constructor(root: RootStore) {
        this.root = root;
    }

    getComponent<T extends ContainerType>(type: T): ContainerComponent<T> | undefined {
        return this.components.get(type) as ContainerComponent<T> | undefined;
    }

    registerContainerComponent<T extends ContainerType>(type: T, component: ContainerComponent<T>) {
        this.components.set(type, component as ContainerComponent<any>);
    }

    get registeredContainerTypes(): ContainerType[] {
        return [...this.components.keys()];
    }

    isValidContainerType(type?: string): type is ContainerType {
        if (!type) {
            return false;
        }
        return this.components.has(type as ContainerType);
    }
}

export default ComponentStore;
