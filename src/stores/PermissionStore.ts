import { Access } from '@tdev-api/document';
import {
    GroupPermission as GroupPermissionProps,
    UserPermission as UserPermissionProps,
    documentRootPermissions as apiDocumentRootPermissions,
    createGroupPermission as createGroupPermissionApi,
    createUserPermission as createUserPermissionApi,
    deleteGroupPermission as deleteGroupPermissionApi,
    deleteUserPermission as deleteUserPermissionApi,
    updateGroupPermission as updateGroupPermissionApi,
    updateUserPermission as updateUserPermissionApi
} from '@tdev-api/permission';
import DocumentRoot from '@tdev-models/DocumentRoot';
import GroupPermission from '@tdev-models/GroupPermission';
import StudentGroup from '@tdev-models/StudentGroup';
import User from '@tdev-models/User';
import UserPermission from '@tdev-models/UserPermission';
import { UnknownMeta } from '@tdev-models/documents/Unknown';
import { AccessLevels, NoneAccess } from '@tdev-models/helpers/accessPolicy';
import iStore, { ApiState } from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import GroupedIndex from '@tdev-stores/utils/GroupedIndex';
import { action, computed, observable } from 'mobx';

const LOAD_PERMISSIONS_REQUEST = 'load-all-permissions';

// One key per set of ids: concurrent loads of different document roots must not abort each other.
const loadPermissionsRequestKey = (documentRootIds: string[]) => {
    const sortedIds = [...documentRootIds].sort();
    return `${LOAD_PERMISSIONS_REQUEST}-${sortedIds.join(',')}` as const;
};

class PermissionStore extends iStore<`update-${string}`> {
    readonly root: RootStore;
    private readonly userPermissionsById = observable.map<string, UserPermission>([], { deep: false });
    private readonly groupPermissionsById = observable.map<string, GroupPermission>([], { deep: false });
    private readonly userPermissionsByRoot = new GroupedIndex<UserPermission>();
    private readonly groupPermissionsByRoot = new GroupedIndex<GroupPermission>();
    private readonly groupPermissionsByGroupId = new GroupedIndex<GroupPermission>();
    // A map instead of a set: ObservableSet.has() tracks the whole set, see AGENTS.md.
    private readonly loadedDocumentRootIds = observable.map<string, true>();

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    @computed
    get userPermissions(): UserPermission[] {
        return [...this.userPermissionsById.values()];
    }

    @computed
    get groupPermissions(): GroupPermission[] {
        return [...this.groupPermissionsById.values()];
    }

    findUserPermission(id?: string): UserPermission | undefined {
        if (!id) {
            return;
        }
        return this.userPermissionsById.get(id);
    }

    findGroupPermission(id?: string): GroupPermission | undefined {
        if (!id) {
            return;
        }
        return this.groupPermissionsById.get(id);
    }

    userPermissionsByDocumentRoot(documentRootId?: string): readonly UserPermission[] {
        return this.userPermissionsByRoot.get(documentRootId);
    }

    groupPermissionsByDocumentRoot(documentRootId?: string): readonly GroupPermission[] {
        return this.groupPermissionsByRoot.get(documentRootId);
    }

    groupPermissionsByGroup(groupId?: string): readonly GroupPermission[] {
        return this.groupPermissionsByGroupId.get(groupId);
    }

    permissionsByDocumentRoot(documentRootId?: string): (UserPermission | GroupPermission)[] {
        if (!documentRootId) {
            return [];
        }
        return [
            ...this.userPermissionsByDocumentRoot(documentRootId),
            ...this.groupPermissionsByDocumentRoot(documentRootId)
        ];
    }

    hasLoadedPermissions(documentRootId: string) {
        return this.loadedDocumentRootIds.has(documentRootId);
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
            this.unindexUserPermission(old);
        }
        this.userPermissionsById.set(userPermission.id, userPermission);
        this.userPermissionsByRoot.add(userPermission.documentRootId, userPermission);
    }

    @action
    addGroupPermission(groupPermission: GroupPermission) {
        const old = this.findGroupPermission(groupPermission.id);
        if (old) {
            if (old.access === groupPermission.access) {
                return;
            }
            this.unindexGroupPermission(old);
        }
        this.groupPermissionsById.set(groupPermission.id, groupPermission);
        this.groupPermissionsByRoot.add(groupPermission.documentRootId, groupPermission);
        this.groupPermissionsByGroupId.add(groupPermission.groupId, groupPermission);
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
            this.unindexUserPermission(permission);
        } else {
            this.unindexGroupPermission(permission);
        }
        this.loadedDocumentRootIds.delete(permission.documentRootId);
    }

    @action
    removeFromStoreByDocumentRootIds(documentRootIds: string[]) {
        documentRootIds.forEach((documentRootId) => {
            // copies of the groups: unindexing mutates them
            [...this.userPermissionsByDocumentRoot(documentRootId)].forEach((p) =>
                this.unindexUserPermission(p)
            );
            [...this.groupPermissionsByDocumentRoot(documentRootId)].forEach((p) =>
                this.unindexGroupPermission(p)
            );
            this.loadedDocumentRootIds.delete(documentRootId);
        });
    }

    @action
    deleteUserPermission(permission?: UserPermission) {
        if (!permission) {
            return Promise.resolve();
        }
        this.withAbortController(`destroy-${permission.id}`, async (signal) => {
            return deleteUserPermissionApi(permission.id, signal.signal).then(
                action(({ data }) => {
                    this.unindexUserPermission(permission);
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
                    this.unindexGroupPermission(permission);
                })
            );
        });
    }

    @computed
    get isLoadingPermissions() {
        return [...this.apiState.entries()].some(
            ([key, state]) => key.startsWith(LOAD_PERMISSIONS_REQUEST) && state === ApiState.SYNCING
        );
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
                  (id) => !this.root.documentRootStore.find(id) || !this.hasLoadedPermissions(id)
              );
        if (idsToLoad.length === 0) {
            return Promise.resolve();
        }
        return this.withAbortController(loadPermissionsRequestKey(idsToLoad), async (signal) => {
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
                        this.loadedDocumentRootIds.set(p.id, true);
                    });
                })
            );
        });
    }

    @action
    cleanup() {
        this.userPermissionsById.clear();
        this.groupPermissionsById.clear();
        this.userPermissionsByRoot.clear();
        this.groupPermissionsByRoot.clear();
        this.groupPermissionsByGroupId.clear();
        this.loadedDocumentRootIds.clear();
    }

    // A stale instance must not unindex the permission that replaced it under the same id.
    @action
    private unindexUserPermission(permission: UserPermission) {
        if (this.userPermissionsById.get(permission.id) !== permission) {
            return;
        }
        this.userPermissionsById.delete(permission.id);
        this.userPermissionsByRoot.remove(permission.documentRootId, permission);
    }

    @action
    private unindexGroupPermission(permission: GroupPermission) {
        if (this.groupPermissionsById.get(permission.id) !== permission) {
            return;
        }
        this.groupPermissionsById.delete(permission.id);
        this.groupPermissionsByRoot.remove(permission.documentRootId, permission);
        this.groupPermissionsByGroupId.remove(permission.groupId, permission);
    }
}

export default PermissionStore;
