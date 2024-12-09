import { action, computed, observable } from 'mobx';
import { Access } from '@tdev-api/document';
import PermissionStore from '@tdev-stores/PermissionStore';
import { GroupPermission as GroupPermissionProps } from '@tdev-api/permission';
import User from '@tdev-models/User';

class GroupPermission {
    readonly store: PermissionStore;

    readonly id: string;
    readonly documentRootId: string;
    readonly groupId: string;

    @observable accessor _access: Access;

    constructor(props: GroupPermissionProps, store: PermissionStore) {
        this.store = store;
        this.id = props.id;
        this._access = props.access;
        this.documentRootId = props.documentRootId;
        this.groupId = props.groupId;
    }

    get access() {
        return this._access;
    }

    @action
    setAccess(access: Access) {
        if (this._access === access) {
            return;
        }
        this._access = access;
        this.store.saveGroupPermission(this);
    }

    @computed
    get group() {
        return this.store.root.studentGroupStore.find(this.groupId);
    }

    @computed
    get userIds() {
        return this.group?.userIds;
    }

    @computed
    get users() {
        const userIds = this.userIds;
        if (!userIds) {
            return [];
        }
        return this.store.root.userStore.users.filter((u) => userIds.has(u.id));
    }

    isAffectingUser(user: User) {
        if (!this.userIds) {
            return false;
        }
        return this.userIds.has(user.id);
    }

    @action
    delete() {
        this.store.deleteGroupPermission(this);
    }
}

export default GroupPermission;
