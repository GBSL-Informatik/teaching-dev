import { action, computed, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { computedFn } from 'mobx-utils';
import StudentGroup from '@tdev-models/StudentGroup';
import iStore from '@tdev-stores/iStore';
import {
    create as apiCreate,
    all as apiAll,
    update as apiUpdate,
    addUser as apiAddUser,
    removeUser as apiRemoveUser,
    destroy as apiDestroy,
    setAdminRole as apiSetAdminRole,
    StudentGroup as ApiStudentGroup
} from '../api/studentGroup';
import User from '../models/User';

export class StudentGroupStore extends iStore<`members-${string}`> {
    readonly root: RootStore;
    studentGroups = observable.array<StudentGroup>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    find = computedFn(
        function (this: StudentGroupStore, id?: string | null): StudentGroup | undefined {
            if (!id) {
                return;
            }
            return this.studentGroups.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    @computed
    get managedStudentGroups() {
        if (!this.root.userStore.current) {
            return [];
        }
        if (this.root.userStore.current?.isAdmin) {
            return this.studentGroups;
        }
        return this.studentGroups.filter((group) => group.isGroupAdmin);
    }

    findByName = computedFn(
        function (this: StudentGroupStore, name?: string): StudentGroup | undefined {
            if (!name) {
                return;
            }
            const nameMatcher = new RegExp(`^${name}$`, 'i');
            return this.studentGroups.find((d) => nameMatcher.test(d.name));
        },
        { keepAlive: true }
    );

    @action
    create(name: string, description: string, parentId?: string) {
        return this.withAbortController(`create-${name}`, async (signal) => {
            return apiCreate({ name, description, parentId }, signal.signal).then(
                action(({ data }) => {
                    const group = new StudentGroup(data, this);
                    this.studentGroups.push(group);
                    return group;
                })
            );
        });
    }

    @action
    addToStore(studentGroup: StudentGroup) {
        const old = this.find(studentGroup.id);
        if (old) {
            this.studentGroups.remove(old);
        }
        this.studentGroups.push(studentGroup);
    }

    @action
    removeFromStore(studentGroup?: StudentGroup): StudentGroup | undefined {
        /**
         * Removes the model to the store
         */
        if (studentGroup && this.studentGroups.remove(studentGroup)) {
            return studentGroup;
        }
    }
    @action
    handleUpdate(data: ApiStudentGroup) {
        const model = this.find(data.id);
        if (!model) {
            return;
        }
        const needsReplace = (['name', 'description'] as ('name' | 'description')[]).some(
            (key) => data[key] !== undefined && data[key] !== model[key]
        );
        if (needsReplace) {
            return this.addToStore(new StudentGroup(data, this));
        }
        if (model && model.id) {
            if (data.parentId !== undefined && data.parentId !== model.parentId) {
                model.setParentId(data.parentId);
            }
            if (Array.isArray(data.userIds)) {
                model.userIds.replace(data.userIds);
            }
            if (Array.isArray(data.adminIds)) {
                model.adminIds.replace(data.adminIds);
            }
        }
    }

    @action
    save(studentGroup: StudentGroup) {
        return this.withAbortController(`save-${studentGroup.id}`, async (signal) => {
            return apiUpdate(studentGroup.id, studentGroup.props, signal.signal).then(({ data }) => {
                const group = new StudentGroup({ ...data, userIds: [...studentGroup.userIds] }, this);
                this.addToStore(group);
                return group;
            });
        });
    }

    @action
    destroy(studentGroup: StudentGroup) {
        return this.withAbortController(`destroy-${studentGroup.id}`, async (signal) => {
            return apiDestroy(studentGroup.id, signal.signal).then(
                action(({ data }) => {
                    this.studentGroups.remove(studentGroup);
                    return studentGroup;
                })
            );
        });
    }

    @action
    addUser(studentGroup: StudentGroup, user: User) {
        return this.withAbortController(`members-add-${studentGroup.id}-${user.id}`, async (signal) => {
            return apiAddUser(studentGroup.id, user.id, signal.signal).then(
                action(({ data }) => {
                    if (data) {
                        studentGroup.userIds.add(user.id);
                        return studentGroup;
                    }
                })
            );
        });
    }

    @action
    removeUser(studentGroup: StudentGroup, user: User) {
        return this.withAbortController(`members-rm-${studentGroup.id}-${user.id}`, async (signal) => {
            return apiRemoveUser(studentGroup.id, user.id, signal.signal).then(
                action(({ data }) => {
                    studentGroup.adminIds.delete(user.id);
                    studentGroup.userIds.delete(user.id);
                    return studentGroup;
                })
            );
        });
    }
    @action
    setAdminRole(studentGroup: StudentGroup, user: User, isAdmin: boolean) {
        return this.withAbortController(`members-admin-${studentGroup.id}-${user.id}`, async (signal) => {
            return apiSetAdminRole(studentGroup.id, user.id, isAdmin, signal.signal).then(
                action(({ data }) => {
                    if (isAdmin) {
                        studentGroup.adminIds.add(user.id);
                    } else {
                        studentGroup.adminIds.delete(user.id);
                    }
                    return studentGroup;
                })
            );
        });
    }

    @action
    load() {
        return this.withAbortController('load-all', async (signal) => {
            return apiAll(signal.signal).then(
                action(({ data }) => {
                    const groups = data.map((group) => new StudentGroup(group, this));
                    this.studentGroups.replace(groups);
                    return groups;
                })
            );
        });
    }

    @action
    cleanup() {
        this.studentGroups.clear();
        this.abortControllers.forEach((ctrl) => {
            ctrl.abort('cleanup store');
        });
    }

    get users() {
        return this.root.userStore.users;
    }
}
