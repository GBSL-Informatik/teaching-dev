import type Script from '../models/documents/Script';
import type ScriptVersion from '../models/documents/ScriptVersion';
import type TaskState from '../models/documents/TaskState';
import type String from '../models/documents/String';
import api from './base';
import { AxiosPromise } from 'axios';
import QuillV2 from '../models/documents/QuillV2';
import { Delta } from 'quill/core';
import Solution from '../models/documents/Solution';

export enum Access {
    RO = 'RO',
    RW = 'RW',
    None = 'None'
}

export enum DocumentType {
    Script = 'script',
    ScriptVersion = 'script_version',
    TaskState = 'task_state',
    String = 'string',
    QuillV2 = 'quill_v2',
    Solution = 'solution'
}
export interface ScriptData {
    code: string;
}

export interface ScriptVersionData {
    code: string;
    version: number;
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

export type StateType = 'checked' | 'question' | 'unset' | 'star' | 'star-half' | 'star-empty';

export interface TaskStateData {
    state: StateType;
}

export interface TypeDataMapping {
    [DocumentType.Script]: ScriptData;
    [DocumentType.TaskState]: TaskStateData;
    [DocumentType.ScriptVersion]: ScriptVersionData;
    [DocumentType.String]: StringData;
    [DocumentType.QuillV2]: QuillV2Data;
    [DocumentType.Solution]: SolutionData;
    // Add more mappings as needed
}

export interface TypeModelMapping {
    [DocumentType.Script]: Script;
    [DocumentType.TaskState]: TaskState;
    [DocumentType.ScriptVersion]: ScriptVersion;
    [DocumentType.String]: String;
    [DocumentType.QuillV2]: QuillV2;
    [DocumentType.Solution]: Solution;
    /**
     * Add more mappings as needed
     * TODO: implement the mapping in DocumentRoot.ts
     * @see DocumentRoot
     * @link file://../../src/stores/DocumentStore.ts#CreateDocumentModel
     */
}

export type DocumentTypes = Script | TaskState | ScriptVersion | String | QuillV2 | Solution;

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

export function find<Type extends DocumentType>(
    id: string,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.get(`/documents/${id}`, { signal });
}

export function create<Type extends DocumentType>(
    data: Partial<Document<Type>>,
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.post(`/documents`, data, { signal });
}

export function update<Type extends DocumentType>(
    id: string,
    data: TypeDataMapping[Type],
    signal: AbortSignal
): AxiosPromise<Document<Type>> {
    return api.put(`/documents/${id}`, { data }, { signal });
}
