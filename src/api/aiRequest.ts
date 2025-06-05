import api from './base';
import { AxiosPromise } from 'axios';
export interface Response {
    [key: string]: string | number | boolean | Response | Response[];
}

export interface AiRequest {
    id: string;
    userId: string;
    aiTemplateId: string;
    status: 'pending' | 'completed' | 'failed';
    statusCode?: number;
    request: string;
    response: Response | null;
    createdAt: Date;
    updatedAt: Date;
}

export function createAiRequest(
    aiTemplateId: string,
    request: string,
    signal: AbortSignal
): AxiosPromise<AiRequest> {
    return api.post(`/aiTemplates/${aiTemplateId}/requests`, { request: request }, { signal });
}
export function getAiRequest(aiTemplateId: string, id: string, signal: AbortSignal): AxiosPromise<AiRequest> {
    return api.get(`/aiTemplates/${aiTemplateId}/requests/${id}`, { signal });
}
export function allAiRequests(aiTemplateId: string, signal: AbortSignal): AxiosPromise<AiRequest[]> {
    return api.get(`/aiTemplates/${aiTemplateId}/requests`, { signal });
}
