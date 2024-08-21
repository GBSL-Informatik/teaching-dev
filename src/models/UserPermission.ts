import { action, observable } from 'mobx';
import { Access } from '../api/document';
import PermissionStore from '../stores/PermissionStore';
import { UserPermission as UserPermissionProps } from '../api/permission';
import User from './User';

class UserPermission {
    readonly store: PermissionStore;

    readonly id: string;
    readonly userId: string;
    readonly documentRootId: string;

    @observable accessor _access: Access;

    constructor(props: UserPermissionProps, store: PermissionStore) {
        this.store = store;
        this._access = props.access;
        this.id = props.id;
        this.userId = props.userId;
        this.documentRootId = props.documentRootId;
    }

    isAffectingUser(user: User) {
        return this.userId === user.id;
    }

    get user() {
        return this.store.root.userStore.find(this.userId);
    }

    @action
    set access(access: Access) {
        if (this._access === access) {
            return;
        }
        this._access = access;
        this.store.saveUserPermission(this);
    }

    get access() {
        return this._access;
    }

    @action
    delete() {
        this.store.deleteUserPermission(this);
    }
}

export default UserPermission;