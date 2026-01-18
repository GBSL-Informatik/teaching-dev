import type Script from '@tdev-models/documents/Script';
import type ScriptVersion from '@tdev-models/documents/ScriptVersion';
import type TaskState from '@tdev-models/documents/TaskState';
import type String from '@tdev-models/documents/String';
import api from './base';
import { AxiosPromise } from 'axios';
import QuillV2 from '@tdev-models/documents/QuillV2';
import { Delta } from 'quill/core';
import Solution from '@tdev-models/documents/Solution';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import Restricted from '@tdev-models/documents/Restricted';
import MdxComment from '@tdev-models/documents/MdxComment';
import { Color } from '@tdev-components/shared/Colors';
import CmsText from '@tdev-models/documents/CmsText';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import ProgressState from '@tdev-models/documents/ProgressState';
import type DocumentStore from '@tdev-stores/DocumentStore';
import iDocumentContainer from '@tdev-models/iDocumentContainer';
import iViewStore from '@tdev-stores/ViewStores/iViewStore';

export enum Access {
    RO_DocumentRoot = 'RO_DocumentRoot',
    RW_DocumentRoot = 'RW_DocumentRoot',
    None_DocumentRoot = 'None_DocumentRoot',
    RO_StudentGroup = 'RO_StudentGroup',
    RW_StudentGroup = 'RW_StudentGroup',
    None_StudentGroup = 'None_StudentGroup',
    RO_User = 'RO_User',
    RW_User = 'RW_User',
    None_User = 'None_User'
}

export interface ScriptData {
    code: string;
}

export interface ScriptVersionData {
    code: string;
    pasted?: boolean;
}

export interface StringData {
    text: string;
}

export interface QuillV2Data {
    delta: Delta;
}

export interface SolutionData {
    /** no content needed */
}

export interface RestrictedData {
    /** no content needed */
}

export interface CmsTextData {
    text: string;
}

export interface DirData {
    name: string;
    isOpen: boolean;
}

export interface FileData {
    name: string;
    isOpen: boolean;
}

export type StateType =
    | 'checked'
    | 'question'
    | 'unset'
    | 'star'
    | 'star-half'
    | 'star-empty'
    | 'clock-check'
    | 'progress-check';

export interface TaskStateData {
    state: StateType;
}
export interface ProgressStateData {
    progress: number;
}

export interface MdxCommentData {
    type: string;
    nr: number;
    commentNr: number;
    isOpen: boolean;
    color: Color;
}

export interface DynamicDocumentRootsData<T extends ContainerType> {
    // document type of the container document
    containerType: T;
    documentRootIds: string[];
}

export interface ViewStoreTypeMapping {
    ['_view_store>']: typeof iViewStore; // placeholder to avoid empty interface error
}

export type ViewStoreType = keyof ViewStoreTypeMapping;
export type ViewStore = ViewStoreTypeMapping[ViewStoreType];

export interface ContainerTypeDataMapping {
    ['_container_placeholder_']: { name: string }; // placeholder to avoid empty interface error
}

export interface TypeDataMapping extends ContainerTypeDataMapping {
    ['script']: ScriptData;
    ['task_state']: TaskStateData;
    ['progress_state']: ProgressStateData;
    ['script_version']: ScriptVersionData;
    ['string']: StringData;
    ['quill_v2']: QuillV2Data;
    ['solution']: SolutionData;
    ['dir']: DirData;
    ['file']: FileData;
    ['mdx_comment']: MdxCommentData;
    ['restricted']: RestrictedData;
    ['cms_text']: CmsTextData;
    ['dynamic_document_roots']: DynamicDocumentRootsData<any>;
    // Add more mappings as needed
}
export type ContainerType = keyof ContainerTypeDataMapping;

type KeysWithCode<T> = {
    [K in keyof T]: 'code' extends keyof T[K] ? K : never;
}[keyof Omit<T, 'script_version'>];

export type ScriptTypes = KeysWithCode<TypeDataMapping>;

export interface ContainerTypeModelMapping {
    ['_container_placeholder_']: iDocumentContainer<ContainerType>; // placeholder to avoid empty interface error
}

export interface TypeModelMapping extends ContainerTypeModelMapping {
    ['script']: Script;
    ['task_state']: TaskState;
    ['progress_state']: ProgressState;
    ['script_version']: ScriptVersion;
    ['string']: String;
    ['quill_v2']: QuillV2;
    ['solution']: Solution;
    ['dir']: Directory;
    ['file']: File;
    ['mdx_comment']: MdxComment;
    ['restricted']: Restricted;
    ['cms_text']: CmsText;
    ['dynamic_document_roots']: DynamicDocumentRoots<any>;
    /**
     * Add more mappings as needed
     * TODO: implement the mapping in DocumentRoot.ts
     * @see DocumentRoot
     * @link file://../../src/stores/DocumentStore.ts#CreateDocumentModel
     */
}

export type ContainerModelType = ContainerTypeModelMapping[ContainerType];

export type DocumentType = keyof TypeModelMapping;
export type DocumentModelType = TypeModelMapping[DocumentType];

/**
 * Document types that can be edited by admins ON BEHALF OF other users.
 * This should not be the default case for most documents - but things like CMS texts
 * should be editeable by admins only.
 */
export const ADMIN_EDITABLE_DOCUMENTS: DocumentType[] = ['cms_text'] as const;
export interface Document<Type extends DocumentType> {
    id: string;
    type: Type;
    authorId: string;

    parentId: string | null | undefined;
    documentRootId: string;

    data: TypeDataMapping[Type];

    createdAt: string;
    updatedAt: string;
}

export type Factory<Type extends DocumentType = DocumentType> = (
    data: Document<Type>,
    store: DocumentStore
) => TypeModelMapping[Type];

export function find<Type extends DocumentType>(
    id: string,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.get(`/documents/${id}`, { signal });
}

export function create<Type extends DocumentType>(
    data: Partial<Document<Type>>,
    onBehalfOf: boolean,
    isMain: boolean,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    const queryParams: string[] = [];
    if (onBehalfOf) {
        queryParams.push('onBehalfOf=true');
    }
    if (isMain) {
        queryParams.push('uniqueMain=true');
    }
    return api.post(`/documents${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`, data, {
        signal
    });
}

export function remove(id: string, signal: AbortSignal): AxiosPromise<void> {
    return api.delete(`/documents/${id}`, { signal });
}

export function update<Type extends DocumentType>(
    id: string,
    data: TypeDataMapping[Type],
    onBehalfOf: boolean,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.put(`/documents/${id}${onBehalfOf ? '?onBehalfOf=true' : ''}`, { data }, { signal });
}

/**
 * TODO: would it be better to only grab documents from a specific student group?
 */
export function allDocuments(documentRootIds: string[], signal: AbortSignal): AxiosPromise<Document<any>[]> {
    return api.get(`/documents?${documentRootIds.map((id) => `rids=${id}`).join('&')}`, {
        signal
    });
}

export function linkTo<Type extends DocumentType>(
    id: string,
    linkToId: string,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.put(`/documents/${id}/linkTo/${linkToId}`, { signal });
}
