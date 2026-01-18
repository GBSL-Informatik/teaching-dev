import { RootStore } from './rootStore';
import {
    type ScriptTypes,
    TypeModelMapping,
    type ContainerType,
    type ContainerTypeModelMapping
} from '@tdev-api/document';
import { ContainerMeta } from '@tdev-models/documents/DynamicDocumentRoots/ContainerMeta';
import iScript from '@tdev-models/documents/iScript';
import React from 'react';

export interface ContainerProps<T extends ContainerType = ContainerType> {
    documentContainer: ContainerTypeModelMapping[T];
}

export interface ContainerComponent<T extends ContainerType = ContainerType> {
    defaultMeta: ContainerMeta<T>;
    component: React.ComponentType<ContainerProps<T>>;
}

export interface EditorComponentProps<T extends ScriptTypes = ScriptTypes> {
    script: TypeModelMapping[T];
}

export interface EditorComponent<T extends ScriptTypes = ScriptTypes> {
    /**
     * e.g. to run code or to show the title
     */
    Header?: React.ComponentType<EditorComponentProps<T>>;
    /**
     * e.g. to show the outputs/logs
     */
    Logs?: React.ComponentType<EditorComponentProps<T>>;

    /**
     * components used for additional things, e.g. turtle outputs.
     */
    Meta?: React.ComponentType<EditorComponentProps<T>>;
}

class ComponentStore {
    readonly root: RootStore;
    components = new Map<ContainerType, ContainerComponent>();
    editorComponents = new Map<ScriptTypes, EditorComponent>();

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

    editorComponent<T extends ScriptTypes>(type: T): EditorComponent<T> | undefined {
        return this.editorComponents.get(type) as EditorComponent<T> | undefined;
    }

    registerEditorComponent<T extends ScriptTypes>(type: T, component: EditorComponent<T>) {
        this.editorComponents.set(type, component as EditorComponent<any>);
    }
}

export default ComponentStore;
