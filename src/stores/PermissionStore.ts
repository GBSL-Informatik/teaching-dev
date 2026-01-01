import { action, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { computedFn } from 'mobx-utils';
import UserPermission from '@tdev-models/UserPermission';
import GroupPermission from '@tdev-models/GroupPermission';
import iStore from '@tdev-stores/iStore';
import {
    GroupPermission as GroupPermissionProps,
    UserPermission as UserPermissionProps,
    createGroupPermission as createGroupPermissionApi,
    createUserPermission as createUserPermissionApi,
    updateGroupPermission as updateGroupPermissionApi,
    updateUserPermission as updateUserPermissionApi,
    deleteUserPermission as deleteUserPermissionApi,
    deleteGroupPermission as deleteGroupPermissionApi,
    permissionsFor
} from '@tdev-api/permission';
import DocumentRoot from '@tdev-models/DocumentRoot';
import User from '@tdev-models/User';
import { Access } from '@tdev-api/document';
import StudentGroup from '@tdev-models/StudentGroup';
import { AccessLevels, NoneAccess } from '@tdev-models/helpers/accessPolicy';

class PermissionStore extends iStore<`update-${string}`> {
    readonly root: RootStore;
    userPermissions = observable.array<UserPermission>([]);
    groupPermissions = observable.array<GroupPermission>([]);
    @observable accessor permissionsLoadedForDocumentRootIds = new Set<string>();

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    findUserPermission = computedFn(
        function (this: PermissionStore, id?: string): UserPermission | undefined {
            if (!id) {
                return;
            }
            return this.userPermissions.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    findGroupPermission = computedFn(
        function (this: PermissionStore, id?: string): GroupPermission | undefined {
            if (!id) {
                return;
            }
            return this.groupPermissions.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    userPermissionsByDocumentRoot = computedFn(
        function (this: PermissionStore, documentRootId?: string): UserPermission[] {
            if (!documentRootId) {
                return [];
            }
            return this.userPermissions.filter((p) => p.documentRootId === documentRootId);
        },
        { keepAlive: true }
    );

    groupPermissionsByDocumentRoot = computedFn(
        function (this: PermissionStore, documentRootId?: string): GroupPermission[] {
            if (!documentRootId) {
                return [];
            }
            return this.groupPermissions.filter((p) => p.documentRootId === documentRootId);
        },
        { keepAlive: true }
    );

    permissionsByDocumentRoot(documentRootId?: string): (UserPermission | GroupPermission)[] {
        if (!documentRootId) {
            return [];
        }
        return [
            ...this.userPermissionsByDocumentRoot(documentRootId),
            ...this.groupPermissionsByDocumentRoot(documentRootId)
        ];
    }

    get studentGroups() {
        return this.root.studentGroupStore.studentGroups;
    }

    @action
    addUserPermission(userPermission: UserPermission) {
        const old = this.findUserPermission(userPermission.id);
        if (old) {
            if (old.access === userPermission.access) {
                return;
            }
            this.userPermissions.remove(old);
        }
        this.userPermissions.push(userPermission);
    }

    @action
    addGroupPermission(groupPermission: GroupPermission) {
        const old = this.findGroupPermission(groupPermission.id);
        if (old) {
            if (old.access === groupPermission.access) {
                return;
            }
            this.groupPermissions.remove(old);
        }
        this.groupPermissions.push(groupPermission);
    }

    @action
    handleUserPermissionUpdate(permission: UserPermissionProps) {
        const docRoot = this.root.documentRootStore.find(permission.documentRootId);
        if (!docRoot) {
            return;
        }
        const newPermission = new UserPermission(permission, this);
        const old = docRoot.permission;
        this.addUserPermission(newPermission);
        const needsReload = NoneAccess.has(old) && !NoneAccess.has(docRoot.permission);
        if (needsReload) {
            this.root.documentRootStore.reload(docRoot);
        }
    }

    @action
    handleGroupPermissionUpdate(permission: GroupPermissionProps) {
        const docRoot = this.root.documentRootStore.find(permission.documentRootId);
        if (!docRoot) {
            return;
        }
        const newPermission = new GroupPermission(permission, this);
        const needsReload =
            NoneAccess.has(docRoot.permission) &&
            !NoneAccess.has(permission.access) &&
            AccessLevels.get(permission.access)! < AccessLevels.get(docRoot.permission)!;
        if (needsReload) {
            this.root.documentRootStore.reload(docRoot);
        } else {
            this.addGroupPermission(newPermission);
        }
    }

    @action
    createUserPermission(documentRootId: string, user: User, access: Access) {
        this.withAbortController(`create-${documentRootId}-${user.id}`, async (signal) => {
            return createUserPermissionApi(
                {
                    userId: user.id,
                    access: access,
                    documentRootId: documentRootId
                },
                signal.signal
            ).then(({ data }) => {
                this.addUserPermission(new UserPermission(data, this));
            });
        });
    }

    @action
    createGroupPermission(documentRoot: DocumentRoot<any>, group: StudentGroup, access: Access) {
        this.withAbortController(`create-${documentRoot.id}-${group.id}`, async (signal) => {
            return createGroupPermissionApi(
                {
                    groupId: group.id,
                    access: access,
                    documentRootId: documentRoot.id
                },
                signal.signal
            ).then(({ data }) => {
                this.addGroupPermission(new GroupPermission(data, this));
            });
        });
    }

    @action
    saveUserPermission(permission: UserPermission) {
        return this.withAbortController(`update-${permission.id}`, async (signal) => {
            return updateUserPermissionApi(permission.id, permission.access, signal.signal).then(
                ({ data }) => {
                    this.addUserPermission(new UserPermission(data, this));
                }
            );
        });
    }

    @action
    saveGroupPermission(permission: GroupPermission) {
        this.withAbortController(`update-${permission.id}`, async (signal) => {
            return updateGroupPermissionApi(permission.id, permission.access, signal.signal).then(
                ({ data }) => {
                    this.addGroupPermission(new GroupPermission(data, this));
                }
            );
        });
    }

    @action
    removeFromStore(permission?: UserPermission | GroupPermission) {
        if (!permission) {
            return;
        }
        if (permission instanceof UserPermission) {
            this.userPermissions.remove(permission);
        } else {
            this.groupPermissions.remove(permission);
        }
    }

    @action
    deleteUserPermission(permission?: UserPermission) {
        if (!permission) {
            return Promise.resolve();
        }
        this.withAbortController(`destroy-${permission.id}`, async (signal) => {
            return deleteUserPermissionApi(permission.id, signal.signal).then(
                action(({ data }) => {
                    this.userPermissions.remove(permission);
                })
            );
        });
    }

    @action
    deleteGroupPermission(permission?: GroupPermission) {
        if (!permission) {
            return Promise.resolve();
        }
        this.withAbortController(`destroy-${permission.id}`, async (signal) => {
            return deleteGroupPermissionApi(permission.id, signal.signal).then(
                action(({ data }) => {
                    this.groupPermissions.remove(permission);
                })
            );
        });
    }

    @action
    loadPermissions(documentRoot: DocumentRoot<any>) {
        if (this.permissionsLoadedForDocumentRootIds.has(documentRoot.id)) {
            return Promise.resolve();
        }
        this.withAbortController(`load-permissions-${documentRoot.id}`, async (signal) => {
            console.log('Loading permissions for document root', documentRoot.id);
            return permissionsFor(documentRoot.id, signal.signal).then(
                action(({ data }) => {
                    const docRootId = data.id;
                    data.userPermissions.forEach((p) => {
                        this.addUserPermission(new UserPermission({ ...p, documentRootId: docRootId }, this));
                    });
                    data.groupPermissions.forEach((p) => {
                        this.addGroupPermission(
                            new GroupPermission({ ...p, documentRootId: docRootId }, this)
                        );
                    });
                    this.permissionsLoadedForDocumentRootIds.add(documentRoot.id);
                })
            );
        });
    }
}

export default PermissionStore;
