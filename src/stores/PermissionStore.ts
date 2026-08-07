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
    documentRootPermissions as apiDocumentRootPermissions
} from '@tdev-api/permission';
import User from '@tdev-models/User';
import { Access } from '@tdev-api/document';
import StudentGroup from '@tdev-models/StudentGroup';
import { AccessLevels, NoneAccess } from '@tdev-models/helpers/accessPolicy';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { UnknownMeta } from '@tdev-models/documents/Unknown';

class PermissionStore extends iStore<`update-${string}`> {
    readonly root: RootStore;
    userPermissions = observable.array<UserPermission>([]);
    groupPermissions = observable.array<GroupPermission>([]);
    permissionsLoadedForDocumentRootIds = observable.set<string>();

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
        return this.withAbortController(`create-${documentRootId}-${user.id}`, async (signal) => {
            return createUserPermissionApi(
                {
                    userId: user.id,
                    access: access,
                    documentRootId: documentRootId
                },
                signal.signal
            ).then(({ data }) => {
                this.addUserPermission(new UserPermission(data, this));
                return true;
            });
        });
    }

    @action
    createOrUpdateUserPermission(documentRootId: string, user: User, access: Access) {
        const existingPermission = this.userPermissionsByDocumentRoot(documentRootId).find(
            (p) => p.userId === user.id
        );
        if (existingPermission) {
            return existingPermission.setAccess(access);
        } else {
            return this.createUserPermission(documentRootId, user, access);
        }
    }

    @action
    createOrUpdateGroupPermission(documentRootId: string, group: StudentGroup, access: Access) {
        const existingPermission = this.groupPermissionsByDocumentRoot(documentRootId).find(
            (p) => p.groupId === group.id
        );
        if (existingPermission) {
            existingPermission.setAccess(access);
            return Promise.resolve(existingPermission);
        } else {
            return this.createGroupPermission(documentRootId, group, access);
        }
    }

    @action
    createGroupPermission(documentRootId: string, group: StudentGroup, access: Access) {
        return this.withAbortController(`create-${documentRootId}-${group.id}`, async (signal) => {
            return createGroupPermissionApi(
                {
                    groupId: group.id,
                    access: access,
                    documentRootId: documentRootId
                },
                signal.signal
            ).then(({ data }) => {
                const permission = new GroupPermission(data, this);
                this.addGroupPermission(permission);
                return permission;
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
        this.permissionsLoadedForDocumentRootIds.delete(permission.documentRootId);
    }

    @action
    removeFromStoreByDocumentRootIds(documentRootIds: string[]) {
        const docIds = new Set(documentRootIds);
        const filteredUserPermissions = this.userPermissions.filter((p) => !docIds.has(p.documentRootId));
        const filteredGroupPermissions = this.groupPermissions.filter((p) => !docIds.has(p.documentRootId));
        this.userPermissions.replace(filteredUserPermissions);
        this.groupPermissions.replace(filteredGroupPermissions);
        this.permissionsLoadedForDocumentRootIds.replace(
            [...this.permissionsLoadedForDocumentRootIds].filter((id) => !docIds.has(id))
        );
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
    loadAllPermissions(documentRootIds: string[], forceReload: boolean = false) {
        const { current } = this.root.userStore;
        if (!current?.hasElevatedAccess) {
            // API currently only allows elevated users to load permissions.
            return Promise.resolve();
        }
        const idsToLoad = forceReload
            ? documentRootIds
            : documentRootIds.filter(
                  (id) =>
                      !this.root.documentRootStore.find(id) ||
                      !this.permissionsLoadedForDocumentRootIds.has(id)
              );
        if (idsToLoad.length === 0) {
            return Promise.resolve();
        }
        return this.withAbortController('load-all-permissions', async (signal) => {
            return apiDocumentRootPermissions(idsToLoad, signal.signal).then(
                action(({ data }) => {
                    data.forEach((p) => {
                        const docRoot = new DocumentRoot(
                            { id: p.id, access: p.access, sharedAccess: p.sharedAccess },
                            new UnknownMeta(),
                            this.root.documentRootStore,
                            true
                        );
                        const current = this.root.documentRootStore.find(p.id);
                        if (current && !current.isUnknown) {
                            current.setRootAccess(p.access, true);
                            current.setSharedAccess(p.sharedAccess, true);
                        } else {
                            this.root.documentRootStore.addDocumentRoot(docRoot);
                        }

                        p.userPermissions.forEach((up) => {
                            this.addUserPermission(new UserPermission({ ...up, documentRootId: p.id }, this));
                        });
                        p.groupPermissions.forEach((gp) => {
                            this.addGroupPermission(
                                new GroupPermission({ ...gp, documentRootId: p.id }, this)
                            );
                        });
                        this.permissionsLoadedForDocumentRootIds.add(p.id);
                    });
                })
            );
        });
    }

    @action
    cleanup() {
        this.userPermissions.clear();
        this.groupPermissions.clear();
        this.permissionsLoadedForDocumentRootIds.clear();
    }
}

export default PermissionStore;
