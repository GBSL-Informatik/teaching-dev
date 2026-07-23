import { type Access, type Document, type DocumentType } from '@tdev-api/document';
import api from './base';
import { AxiosPromise } from 'axios';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface DocumentPresentation<Type extends DocumentType = DocumentType> {
    document: Document<Type>;
    meta: TypeMeta<Type>;
    access: Access;
    sharedAccess: Access;
}

export interface StudentGroup {
    id: string;
    name: string;
    description: string;
    canPresent: boolean;
    presentedDocument: DocumentPresentation | null;
    userIds: string[];
    adminIds: string[];

    parentId: string | null;

    createdAt: string;
    updatedAt: string;
}

export function all(signal: AbortSignal): AxiosPromise<StudentGroup[]> {
    return api.get(`/studentGroups`, { signal });
}

export function create(data: Partial<StudentGroup> = {}, signal: AbortSignal): AxiosPromise<StudentGroup> {
    return api.post(`/studentGroups`, data, { signal });
}

export function destroy(id: string, signal: AbortSignal): AxiosPromise<StudentGroup> {
    return api.delete(`/studentGroups/${id}`, { signal });
}

export function setAdminRole(
    id: string,
    userId: string,
    isAdmin: boolean,
    signal: AbortSignal
): AxiosPromise<StudentGroup> {
    return api.post(`/studentGroups/${id}/admins/${userId}`, { isAdmin: isAdmin }, { signal });
}

export function update(
    id: string,
    data: Partial<StudentGroup> = {},
    signal: AbortSignal
): AxiosPromise<StudentGroup> {
    return api.put(`/studentGroups/${id}`, { data }, { signal });
}

export function addUser(id: string, userId: string, signal: AbortSignal): AxiosPromise<StudentGroup[]> {
    return api.post(`/studentGroups/${id}/members/${userId}`, { signal });
}

export function removeUser(id: string, userId: string, signal: AbortSignal): AxiosPromise<StudentGroup[]> {
    return api.delete(`/studentGroups/${id}/members/${userId}`, { signal });
}
