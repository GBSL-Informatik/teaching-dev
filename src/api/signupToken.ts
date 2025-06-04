import { AxiosPromise } from 'axios';
import api from './base';

export interface SignupToken {
    id: string;
    method: string; // TODO: Make enum?
    description: string;
    validThrough: Date | null;
    uses: number;
    maxUses: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    // TODO: defaultStudentGroups
}

export function all(signal: AbortSignal): AxiosPromise<SignupToken[]> {
    return api.get('/admin/signupTokens', { signal });
}

export function create(
    data: Omit<SignupToken, 'id' | 'uses' | 'createdAt' | 'updatedAt'>,
    signal: AbortSignal
): AxiosPromise<SignupToken> {
    return api.post('/admin/signupTokens', data, { signal });
}

export function update(
    id: string,
    data: Partial<Omit<SignupToken, 'id' | 'uses'>>,
    signal: AbortSignal
): AxiosPromise<SignupToken> {
    return api.put(`/admin/signupTokens/${id}`, data, { signal });
}

export function destroy(id: string, signal: AbortSignal): AxiosPromise {
    return api.delete(`/admin/signupTokens/${id}`, { signal });
}
