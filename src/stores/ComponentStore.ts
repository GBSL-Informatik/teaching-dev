import { CodeMeta } from '@tdev-models/documents/Code';
import { RootStore } from './rootStore';
import {
    type CodeType,
    type DocumentType,
    TypeModelMapping,
    type ContainerType,
    type ContainerTypeModelMapping,
    TaskableType
} from '@tdev-api/document';
import { ContainerMeta } from '@tdev-models/documents/DynamicDocumentRoots/ContainerMeta';
import iCodeMeta, { MetaInit } from '@tdev-models/documents/iCode/iCodeMeta';
import { computed } from 'mobx';
import React from 'react';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { ModelMeta as ProgressStateMeta } from '@tdev-models/documents/ProgressState';
import { TaskMeta as TaskStateMeta } from '@tdev-models/documents/TaskState';

export type LiveCode = `live_${string}`;

export interface ContainerProps<T extends ContainerType = ContainerType> {
    documentContainer: ContainerTypeModelMapping[T];
}

export interface ContainerComponent<T extends ContainerType = ContainerType> {
    defaultMeta: ContainerMeta<T>;
    component: React.ComponentType<ContainerProps<T>>;
}

export interface EditorComponentProps<T extends CodeType = CodeType> {
    code: TypeModelMapping[T];
}

export interface EditorComponent<T extends CodeType = CodeType> {
    /**
     * e.g. to run code or to show the title
     */
    Header?: React.ComponentType<EditorComponentProps<T>>;
    /**
     * e.g. to show the outputs/logs
     */
    Footer?: React.ComponentType<EditorComponentProps<T>>;

    /**
     * components used for additional things, e.g. turtle outputs.
     */
    Meta?: React.ComponentType<EditorComponentProps<T>>;

    createModelMeta: (props: Partial<MetaInit>) => iCodeMeta<T>;
    codeBlockMetastringMatcher: (metaLiveCode: LiveCode) => T | undefined;
}

class ComponentStore {
    readonly root: RootStore;
    components = new Map<ContainerType, ContainerComponent>();
    editorComponents = new Map<CodeType, EditorComponent>();
    taskableDocumentsMeta = new Map<DocumentType, TypeMeta<TaskableType>>([
        ['task_state', new TaskStateMeta({})],
        ['progress_state', new ProgressStateMeta({})]
    ]);

    constructor(root: RootStore) {
        this.root = root;
    }

    getComponent<T extends ContainerType>(type: T): ContainerComponent<T> | undefined {
        return this.components.get(type) as ContainerComponent<T> | undefined;
    }

    registerContainerComponent<T extends ContainerType>(type: T, component: ContainerComponent<T>) {
        this.components.set(type, component as ContainerComponent<any>);
    }

    registerTaskableDocumentType<T extends TaskableType>(defaultMeta: TypeMeta<T>) {
        this.taskableDocumentsMeta.set(defaultMeta.type, defaultMeta);
    }

    @computed
    get taskableDocuments() {
        return new Set([...this.taskableDocumentsMeta.keys()]);
    }

    @computed
    get defaultMeta() {
        return [
            ...[...this.components.values()].map((comp) => comp.defaultMeta),
            ...[...this.editorComponents.values()].map((comp) => comp.createModelMeta({})),
            ...[...this.taskableDocumentsMeta.values()]
        ];
    }

    @computed
    get registeredContainerTypes(): ContainerType[] {
        return [...this.components.keys()];
    }

    isValidContainerType(type?: string): type is ContainerType {
        if (!type) {
            return false;
        }
        return this.components.has(type as ContainerType);
    }

    editorComponent<T extends CodeType>(type: T): EditorComponent<T> | undefined {
        return this.editorComponents.get(type) as EditorComponent<T> | undefined;
    }

    registerEditorComponent<T extends CodeType>(type: T, component: EditorComponent<T>) {
        this.editorComponents.set(type, component as EditorComponent<any>);
    }

    createEditorMeta<T extends CodeType>(type: T, props: Partial<MetaInit>): iCodeMeta<T> {
        const editorComp = this.editorComponent(type);
        if (!editorComp) {
            return new CodeMeta(props) as iCodeMeta<T>;
        }
        return editorComp.createModelMeta(props) as iCodeMeta<T>;
    }

    matchCodeBlockType(metaLiveCode?: LiveCode): CodeType {
        if (!metaLiveCode) {
            return 'code';
        }
        for (const [, editorComp] of this.editorComponents) {
            const matchedType = editorComp.codeBlockMetastringMatcher(metaLiveCode);
            if (matchedType) {
                return matchedType;
            }
        }
        return 'code';
    }

    @computed
    get registeredCodeTypes(): CodeType[] {
        return [...this.editorComponents.keys()];
    }
}

export default ComponentStore;
