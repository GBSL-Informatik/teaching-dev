import { Role, type User } from '@tdev-api/user';

const TIME_NOW = new Date().toISOString();

export const DEFAULT_OFFLINE_USER: User = {
    id: 'c23c0238-4aeb-457f-9a2c-3d2d5d8931c0',
    email: 'offline.user@tdev.ch',
    name: 'Offline User',
    firstName: 'Offline',
    lastName: 'User',
    role: process.env.NODE_ENV === 'production' ? Role.STUDENT : Role.ADMIN,
    createdAt: TIME_NOW,
    updatedAt: TIME_NOW
};

const UserStore = () => {
    let user: User = { ...DEFAULT_OFFLINE_USER };
    return {
        getUser: () => user,
        setUser: (newUser: User) => {
            user = { ...newUser };
        },
        reset: () => {
            user = { ...DEFAULT_OFFLINE_USER };
        }
    };
};

export const OfflineUser = UserStore();
