import { action, observable } from 'mobx';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';
import PermissionUser from '../models/PermissionUser';
import PermissionGroup from '../models/PermissionGroup';
import iStore from './iStore';
import { RecordType } from '@site/src/api/IoEventTypes';
import { GroupPermission, UserPermission } from '@site/src/api/permission';

class PermissionStore extends iStore {
    readonly root: RootStore;
    userPermissions = observable.array<PermissionUser>([]);
    groupPermissions = observable.array<PermissionGroup>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    findUserPermission = computedFn(
        function (this: PermissionStore, id?: string): PermissionUser | undefined {
            if (!id) {
                return;
            }
            return this.userPermissions.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    findGroupPermission = computedFn(
        function (this: PermissionStore, id?: string): PermissionGroup | undefined {
            if (!id) {
                return;
            }
            return this.groupPermissions.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    permissionsByDocumentRoot = computedFn(
        function (this: PermissionStore, documentRootId?: string): (PermissionUser | PermissionGroup)[] {
            if (!documentRootId) {
                return [];
            }
            return [...this.userPermissions, ...this.groupPermissions].filter(
                (p) => p.documentRootId === documentRootId
            );
        },
        { keepAlive: true }
    );

    get studentGroups() {
        return this.root.studentGroupStore.studentGroups;
    }

    @action
    addUserPermission(userPermission: PermissionUser) {
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
    addGroupPermission(groupPermission: PermissionGroup) {
        const old = this.findUserPermission(groupPermission.id);
        if (old) {
            if (old.access === groupPermission.access) {
                return;
            }
            this.userPermissions.remove(old);
        }
        this.groupPermissions.push(groupPermission);
    }

    @action
    handleUserPermissionUpdate(userPermission: UserPermission) {
        // TODO: Implement.
        console.log('PermissionStore: handling user permission update', userPermission);
    }

    @action
    handleGroupPermissionUpdate(groupPermission: GroupPermission) {
        // TODO: Implement.
        console.log('PermissionStore: handling group permission update', groupPermission);
    }

    @action
    deleteUserPermission(id: string) {
        // TODO: Implement.
        console.log(`PermissionStore: deleting userPermission with id ${id}`);
    }

    @action
    deleteGroupPermission(id: string) {
        // TODO: Implement.
        console.log(`PermissionStore: deleting groupPermission with id ${id}`);
    }
}

export default PermissionStore;
