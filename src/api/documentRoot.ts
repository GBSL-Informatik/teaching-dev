import api from './base';
import { AxiosPromise } from 'axios';
import { Access, Document, DocumentType, RoomType, RoomTypeMapping } from './document';
import { GroupPermissionBase, UserPermissionBase } from './permission';

export interface RootGroupPermission {
    id: string;
    rootGroupPermissions: string;
    access: Access;
}

export interface DocumentRootBase {
    id: string;
    access: Access;
    sharedAccess: Access;
}

export interface DocumentRoot extends DocumentRootBase {
    userPermissions: UserPermissionBase[];
    groupPermissions: GroupPermissionBase[];
    documents: Document<DocumentType>[];
}

export interface Config {
    access?: Access;
    sharedAccess?: Access;
    userPermissions: Omit<UserPermissionBase, 'id'>[];
    groupPermissions: Omit<GroupPermissionBase, 'id'>[];
}

export interface UpdateConfig {
    access?: Access;
    sharedAccess?: Access;
}

export interface DocumentRootUpdate {
    id: string;
    access: Access;
    sharedAccess: Access;
}

export function find(id: string, signal: AbortSignal): AxiosPromise<DocumentRoot> {
    return api.get(`/documentRoots/${id}`, { signal });
}

export function findManyFor(
    userId: string,
    ids: string[],
    ignoreMissingRoots: boolean,
    signal: AbortSignal
): AxiosPromise<DocumentRoot[]> {
    return api.get(
        `/users/${userId}/documentRoots?${ignoreMissingRoots ? 'ignoreMissingRoots=1&' : ''}${ids.map((id) => `ids=${id}`).join('&')}`,
        { signal }
    );
}

export function create(
    id: string,
    data: Partial<Config> = {},
    signal: AbortSignal
): AxiosPromise<DocumentRoot> {
    return api.post(`/documentRoots/${id}`, data, { signal });
}

export function update(id: string, data: UpdateConfig, signal: AbortSignal): AxiosPromise<DocumentRoot> {
    return api.put(`/documentRoots/${id}`, data, { signal });
}

export function remove(id: string, signal: AbortSignal): AxiosPromise<DocumentRoot> {
    return api.delete(`/documentRoots/${id}`, { signal });
}
