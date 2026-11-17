import {
    DocumentModelType,
    TypeModelMapping,
    type CodeType,
    type ContainerType,
    type ContainerTypeModelMapping,
    type DocumentType
} from '@tdev-api/document';
import { CodeMeta } from '@tdev-models/documents/Code';
import iCodeMeta, { MetaInit } from '@tdev-models/documents/iCode/iCodeMeta';
import { computed } from 'mobx';
import React from 'react';
import { RootStore } from './rootStore';
import { RegistrationOptions } from './utils/RegistrationOptions';

export type LiveCode = `live_${string}`;

export interface ContainerProps<T extends ContainerType = ContainerType> {
    documentContainer: ContainerTypeModelMapping[T];
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

    /**
     * Creates the meta of a code block from its props.
     * The default meta is registered with `registerDocumentType`.
     */
    createModelMeta: (props: Partial<MetaInit>) => iCodeMeta<T>;
    codeBlockMetastringMatcher: (metaLiveCode: LiveCode) => T | undefined;
}

class ComponentStore {
    readonly root: RootStore;
    containerComponents = new Map<ContainerType, React.ComponentType<ContainerProps>>();
    editorComponents = new Map<CodeType, EditorComponent>();
    documentViews = new Map<DocumentType, React.ComponentType<{ document: DocumentModelType }>>();

    constructor(root: RootStore) {
        this.root = root;
    }

    containerComponent<T extends ContainerType>(type: T): React.ComponentType<ContainerProps<T>> | undefined {
        return this.containerComponents.get(type) as React.ComponentType<ContainerProps<T>> | undefined;
    }

    /**
     * The default meta of a container type is registered with `registerDocumentType`.
     * Registering a type again replaces its component and warns, unless `override` is set.
     */
    registerContainerComponent<T extends ContainerType>(
        type: T,
        component: React.ComponentType<ContainerProps<T>>,
        options: RegistrationOptions = {}
    ) {
        if (this.containerComponents.has(type) && !options.override) {
            console.warn(`Container component ${type} is already registered, replacing it`);
        }
        this.containerComponents.set(type, component as React.ComponentType<ContainerProps>);
    }

    editorComponent<T extends CodeType>(type: T): EditorComponent<T> | undefined {
        return this.editorComponents.get(type) as EditorComponent<T> | undefined;
    }

    /**
     * Registering a type again replaces its component and warns, unless `override` is set.
     */
    registerEditorComponent<T extends CodeType>(
        type: T,
        component: EditorComponent<T>,
        options: RegistrationOptions = {}
    ) {
        if (this.editorComponents.has(type) && !options.override) {
            console.warn(`Editor component ${type} is already registered, replacing it`);
        }
        this.editorComponents.set(type, component as EditorComponent<any>);
    }

    /**
     * Registering a type again replaces its view and warns, unless `override` is set.
     */
    registerDocumentView<T extends DocumentType>(
        type: T,
        component: React.ComponentType<{ document: TypeModelMapping[T] }>,
        options: RegistrationOptions = {}
    ) {
        if (this.documentViews.has(type) && !options.override) {
            console.warn(`Document view ${type} is already registered, replacing it`);
        }
        this.documentViews.set(type, component as React.ComponentType<{ document: DocumentModelType }>);
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
