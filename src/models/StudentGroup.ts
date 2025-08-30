import { action, computed, observable } from 'mobx';
import { StudentGroup as StudentGroupProps } from '@tdev-api/studentGroup';
import { StudentGroupStore } from '@tdev-stores/StudentGroupStore';
import { formatDateTime } from '@tdev-models/helpers/date';
import User from '@tdev-models/User';
import _ from 'es-toolkit/compat';

class StudentGroup {
    readonly store: StudentGroupStore;

    readonly id: string;
    @observable accessor name: string;
    @observable accessor description: string;

    userIds = observable.set<string>([]);
    adminIds = observable.set<string>([]);

    @observable accessor parentId: string | null;
    @observable accessor isEditing: boolean = false;

    readonly _pristine: { name: string; description: string };

    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: StudentGroupProps, store: StudentGroupStore) {
        this.store = store;
        this.id = props.id;

        this._pristine = { name: props.name, description: props.description };
        this.name = props.name;
        this.description = props.description;

        this.userIds.replace(props.userIds);
        this.adminIds.replace(props.adminIds);
        this.parentId = props.parentId || null;

        this.updatedAt = new Date(props.updatedAt);
        this.createdAt = new Date(props.createdAt);
    }

    get fCreatedAt() {
        return formatDateTime(this.createdAt);
    }

    get fUpdatedAt() {
        return formatDateTime(this.updatedAt);
    }

    @computed
    get students() {
        return this.store.root.userStore.users.filter(
            (u) => this.userIds.has(u.id) && !this.adminIds.has(u.id)
        );
    }

    @computed
    get admins() {
        return this.store.root.userStore.users.filter((u) => this.adminIds.has(u.id));
    }

    @computed
    get searchTerm() {
        return `${this.name} ${this.description}`;
    }

    @computed
    get children() {
        return _.orderBy(
            this.store.studentGroups.filter((g) => g.parentId === this.id),
            ['name'],
            ['asc']
        );
    }

    @action
    setEditing(isEditing: boolean) {
        this.isEditing = isEditing;
    }

    @action
    setDescription(description: string) {
        this.description = description;
    }

    @action
    setName(name: string) {
        this.name = name;
    }

    @action
    addStudent(student: User) {
        return this.store.addUser(this, student);
    }

    @action
    removeStudent(student: User) {
        return this.store.removeUser(this, student);
    }

    @computed
    get isGroupAdmin() {
        const { current } = this.store.root.userStore;
        if (!current || !current.hasElevatedAccess) {
            return false;
        }
        return current.isAdmin || this.adminIds.has(current.id);
    }

    @action
    setAdminRole(user: User, isAdmin: boolean) {
        if (!this.isGroupAdmin) {
            return;
        }
        return this.store.setAdminRole(this, user, isAdmin);
    }

    @action
    reset() {
        this.name = this._pristine.name;
        this.description = this._pristine.description;
    }

    @action
    save() {
        return this.store.save(this);
    }

    @computed
    get props(): Omit<StudentGroupProps, 'userIds' | 'createdAt' | 'updatedAt' | 'adminIds'> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            parentId: this.parentId
        };
    }

    @action
    setParentId(parentId: string | null) {
        this.parentId = parentId;
        this.save();
    }

    @computed
    get parent(): StudentGroup | undefined {
        return this.store.find(this.parentId);
    }

    @computed
    get parentIds(): string[] {
        return this.parent ? [this.parent.id, ...this.parent.parentIds] : [];
    }
}

export default StudentGroup;
