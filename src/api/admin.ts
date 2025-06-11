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

export interface AiTemplate {
    id: string;
    rateLimit: number;
    rateLimitPeriodMs: number;
    isActive: boolean;
    authorId: string;

    apiKey: string;
    apiUrl: string;

    config: Record<string, any>;

    createdAt: string;
    updatedAt: string;
}

export function createAiTemplate(
    data: Omit<AiTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    signal: AbortSignal
): AxiosPromise<AiTemplate> {
    return api.post('/admin/aiTemplates', data, { signal });
}

export function updateAiTemplate(
    id: string,
    data: Partial<Omit<AiTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
    signal: AbortSignal
): AxiosPromise<AiTemplate> {
    return api.put(`/admin/aiTemplates/${id}`, data, { signal });
}
export function deleteAiTemplate(id: string, signal: AbortSignal): AxiosPromise {
    return api.delete(`/admin/aiTemplates/${id}`, { signal });
}
export function getAllAiTemplates(signal: AbortSignal): AxiosPromise<AiTemplate[]> {
    return api.get('/admin/aiTemplates', { signal });
}
export function getAiTemplate(id: string, signal: AbortSignal): AxiosPromise<AiTemplate> {
    return api.get(`/admin/aiTemplates/${id}`, { signal });
}
