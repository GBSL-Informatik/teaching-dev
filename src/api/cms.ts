import api from './base';
import { AxiosPromise } from 'axios';

export interface CmsSettings {
    id: string;
    userId: string;
    activeBranch?: string | null;
    activePath?: string | null;
    token?: string;
    tokenExpiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FullCmsSettings extends CmsSettings {
    token: string;
    tokenExpiresAt: string;
}

export function load(signal: AbortSignal): AxiosPromise<CmsSettings> {
    return api.get(`/cms/settings`, { signal });
}
export function update(data: Partial<CmsSettings>, signal: AbortSignal): AxiosPromise {
    return api.put(`/cms/settings`, { ...data }, { signal });
}
export function githubToken(token: string, signal: AbortSignal): AxiosPromise<CmsSettings> {
    return api.get(`/cms/github-token?code=${token}`, { signal });
}

export function logout(signal: AbortSignal): AxiosPromise<CmsSettings> {
    return api.post(`/cms/logout`, { signal });
}
