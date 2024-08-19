import { action, computed, observable } from 'mobx';
import { StudentGroup as StudentGroupProps } from '../api/studentGroup';
import { StudentGroupStore } from '../stores/StudentGroupStore';
import { formatDateTime } from './helpers/date';
import User from './User';

class StudentGroup {
    readonly store: StudentGroupStore;

    readonly id: string;
    @observable accessor name: string;
    @observable accessor description: string;

    userIds = observable.set<string>([]);

    @observable accessor parentId: string | undefined;

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
        this.parentId = props.parentId;

        this.updatedAt = new Date(props.updatedAt);
        this.createdAt = new Date(props.createdAt);
    }

    @computed
    get users() {
        return this.store.users.filter((u) => this.userIds.has(u.id));
    }

    get fCreatedAt() {
        return formatDateTime(this.createdAt);
    }

    get fUpdatedAt() {
        return formatDateTime(this.updatedAt);
    }

    @computed
    get students() {
        return this.store.root.userStore.users.filter((u) => this.userIds.has(u.id));
    }

    @computed
    get searchTerm() {
        return `${this.name} ${this.description}`;
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
    reset() {
        this.name = this._pristine.name;
        this.description = this._pristine.description;
    }

    @action
    removeStudent(student: User) {
        return this.store.removeUser(this, student);
    }

    @action
    save() {
        return this.store.save(this);
    }

    @computed
    get props(): Omit<StudentGroupProps, 'userIds' | 'createdAt' | 'updatedAt'> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            parentId: this.parentId
        };
    }
}

export default StudentGroup;
