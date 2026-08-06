import api from './base';
import { AxiosPromise } from 'axios';
import { Access } from './document';

export interface GroupPermissionBase {
    id: string;
    groupId: string;
    access: Access;
}

export interface GroupPermission extends GroupPermissionBase {
    documentRootId: string;
}

export interface UserPermissionBase {
    id: string;
    userId: string;
    access: Access;
}

export interface UserPermission extends UserPermissionBase {
    documentRootId: string;
}

export type Permissions = {
    id: string;
    access: Access;
    sharedAccess: Access;
    userPermissions: UserPermissionBase[];
    groupPermissions: GroupPermissionBase[];
};

export function createUserPermission(
    data: Omit<UserPermission, 'id'>,
    signal: AbortSignal
): AxiosPromise<UserPermission> {
    return api.post('/permissions/user', data, { signal });
}

export function updateUserPermission(
    id: string,
    access: Access,
    signal: AbortSignal
): AxiosPromise<UserPermission> {
    return api.put(`/permissions/user/${id}`, { access: access }, { signal });
}

export function deleteUserPermission(id: string, signal: AbortSignal): AxiosPromise {
    return api.delete(`/permissions/user/${id}`, { signal });
}

export function createGroupPermission(
    data: Omit<GroupPermission, 'id'>,
    signal: AbortSignal
): AxiosPromise<GroupPermission> {
    return api.post('/permissions/group', data, { signal });
}

export function updateGroupPermission(
    id: string,
    access: Access,
    signal: AbortSignal
): AxiosPromise<GroupPermission> {
    return api.put(`/permissions/group/${id}`, { access: access }, { signal });
}

export function deleteGroupPermission(id: string, signal: AbortSignal): AxiosPromise {
    return api.delete(`/permissions/group/${id}`, { signal });
}

export function permissionsFor(documentRootId: string, signal: AbortSignal): AxiosPromise<Permissions> {
    return api.get(`/documentRoots/${documentRootId}/permissions`, { signal });
}

export function documentRootPermissions(
    documentRootIds: string[],
    signal: AbortSignal
): AxiosPromise<Permissions[]> {
    const data = {
        documentRootIds: documentRootIds
    };
    return api.post(`/documentRoots/permissions`, data, { signal });
}
