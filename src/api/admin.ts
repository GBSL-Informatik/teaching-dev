import api from './base';
import { AxiosPromise } from 'axios';
import { DocumentType } from './document';

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
