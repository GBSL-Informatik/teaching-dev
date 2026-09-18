import StudentGroup from '@tdev-models/StudentGroup';
import { RootStore } from '@tdev-stores/rootStore';
import { orderBy } from 'es-toolkit/array';
import { action, computed, observable } from 'mobx';

export class AdminView {
    readonly root: RootStore;
    @observable accessor groupSearchFilter = '';
    openGroupIds = observable.set<string>([]);

    constructor(root: RootStore) {
        this.root = root;
    }

    @action
    setGroupSearchFilter(filter?: string) {
        this.groupSearchFilter = filter ?? '';
        this.openGroupIds.clear();
    }

    @action
    setGroupOpen(groupId: string, isOpen: boolean) {
        if (isOpen) {
            this.openGroupIds.add(groupId);
        } else {
            this.openGroupIds.delete(groupId);
        }
    }

    @computed
    get filteredStudentGroups() {
        const filter = new RegExp(this.groupSearchFilter, 'i');
        const startsWith = new RegExp(`^${this.groupSearchFilter}`, 'i');
        const groups = this.root.studentGroupStore.managedStudentGroups
            .filter((g) => !g.parentId)
            .map((group) => {
                // Group name, student name or student email starts with the search filter?
                const startsWithMatch =
                    startsWith.test(group.name) ||
                    group.students?.some((s) => startsWith.test(s.name) || startsWith.test(s.email));
                if (startsWithMatch) {
                    return {
                        group: group,
                        matchPriority: 0
                    };
                }

                // Student name or email matches (RegExp)?
                const studentMatch = group.students?.some((s) => filter.test(s.name) || filter.test(s.email));
                if (studentMatch) {
                    return {
                        group: group,
                        matchPriority: 1
                    };
                }

                const nestedSearch = (g: StudentGroup, test: (group: StudentGroup) => boolean): boolean => {
                    if (test(g)) {
                        return true;
                    }
                    for (const child of g.children) {
                        if (nestedSearch(child, test)) {
                            return true;
                        }
                    }
                    return false;
                };

                // Group name matches (RegExp)?
                const groupNameMatch = nestedSearch(group, (g) => filter.test(g.name));
                if (groupNameMatch) {
                    return {
                        group: group,
                        matchPriority: 2
                    };
                }

                // Description matches (RegExp)?
                const descriptionMatch = nestedSearch(group, (g) => filter.test(g.description ?? ''));
                if (descriptionMatch) {
                    return {
                        group: group,
                        matchPriority: 3
                    };
                }
            })
            .filter((group) => !!group); // Non-matched groups are null - filter them out.
        return orderBy(
            groups,
            ['matchPriority', (m) => m.group._pristine.name, (m) => m.group.createdAt],
            ['asc', 'asc', 'desc']
        );
    }
}
