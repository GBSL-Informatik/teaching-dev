import api from './base';
import { AxiosPromise } from 'axios';
import { DocumentType } from './document';

export interface AllowedAction {
    id: string;
    documentType: DocumentType;
    action: `update@${string}`;
}

export interface SignupToken {
    id: string;
    method: string; // TODO: Make enum?
    description: string;
    validThrough?: Date;
    uses: number;
    maxUses: number;
    disabled: boolean;
    // TODO: defaultStudentGroups
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

export function signupTokens(signal: AbortSignal): AxiosPromise<SignupToken[]> {
    return api.get('/admin/signupTokens', { signal });
}
