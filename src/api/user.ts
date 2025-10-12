import api from './base';
import { AxiosPromise } from 'axios';

export enum Role {
    STUDENT = 'student',
    TEACHER = 'teacher',
    ADMIN = 'admin'
}

export const RoleNames: { [key in Role]: string } = {
    [Role.STUDENT]: 'SuS',
    [Role.TEACHER]: 'LP',
    [Role.ADMIN]: 'Admin'
};

export const RoleAccessLevel: { [key in Role]: number } = {
    [Role.STUDENT]: 0,
    [Role.TEACHER]: 1,
    [Role.ADMIN]: 2
};

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
};

export function currentUser(signal: AbortSignal): AxiosPromise<User> {
    return api.get('/user', { signal });
}

export function logout(signal: AbortSignal): AxiosPromise<void> {
    return api.post('/logout', {}, { signal });
}

export function all(signal: AbortSignal): AxiosPromise<User[]> {
    return api.get('/users', { signal });
}

export function update(id: string, data: Partial<User>, signal: AbortSignal): AxiosPromise<User> {
    return api.put(`/users/${id}`, { data }, { signal });
}
