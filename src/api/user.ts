import { mdiEmailLock, mdiGithub, mdiMicrosoft } from '@mdi/js';
import api from './base';
import { AxiosPromise } from 'axios';
import { IfmColors } from '@tdev-components/shared/Colors';

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

export const RoleColors: { [key in Role]: string } = {
    [Role.STUDENT]: 'blue',
    [Role.TEACHER]: 'green',
    [Role.ADMIN]: 'red'
};

export const RoleAccessLevel: { [key in Role]: number } = {
    [Role.STUDENT]: 0,
    [Role.TEACHER]: 1,
    [Role.ADMIN]: 2
};

export enum AuthProvider {
    MICROSOFT = 'microsoft',
    CREDENTIAL = 'credential',
    GITHUB = 'github'
}

export const AuthProviderIcons = {
    [AuthProvider.MICROSOFT]: mdiMicrosoft,
    [AuthProvider.CREDENTIAL]: mdiEmailLock,
    [AuthProvider.GITHUB]: mdiGithub
};

export const AuthProviderColor = {
    [AuthProvider.MICROSOFT]: IfmColors.blue,
    [AuthProvider.CREDENTIAL]: IfmColors.info,
    [AuthProvider.GITHUB]: IfmColors.black
};

export type User = {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: Role;
    authProviders?: AuthProvider[];
    banned?: boolean;
    banReason?: string;
    banExpires?: Date;
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
