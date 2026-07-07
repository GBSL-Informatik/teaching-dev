import api from './base';
import { AxiosPromise } from 'axios';
import type { Document, DocumentType } from './document';
import { User } from './user';

export interface AllowedAction {
    id: string;
    documentType: DocumentType;
    action: `update@${string}`;
}

export function deleteAllowedAction(id: string, signal: AbortSignal): AxiosPromise {
    return api.delete(`/admin/allowedActions/${id}`, { signal });
}

export function createAllowedAction(
    data: Omit<AllowedAction, 'id'>,
    signal: AbortSignal
): AxiosPromise<AllowedAction> {
    return api.post('/admin/allowedActions', data, { signal });
}

export function allowedActions(signal: AbortSignal): AxiosPromise<AllowedAction[]> {
    return api.get(`/admin/allowedActions`, { signal });
}

export function linkUserPassword(userId: string, userPW: string, signal: AbortSignal): AxiosPromise<void> {
    return api.post(`/admin/users/${userId}/linkUserPassword`, { pw: userPW }, { signal });
}

export function revokeUserPassword(userId: string, signal: AbortSignal): AxiosPromise<void> {
    return api.post(`/admin/users/${userId}/revokeUserPassword`, { signal });
}

type ExportData = {
    user: Omit<User, 'role' | 'authProviders' | 'banned' | 'banReason' | 'banExpires'>;
    documents: Document<any>[];
};

export function exportUserData(
    userIds: string[],
    ignoredDocumentTypes: DocumentType[],
    signal: AbortSignal
): AxiosPromise<ExportData[]> {
    return api.post(`/admin/export`, { userIds, ignoredDocumentTypes }, { signal });
}
