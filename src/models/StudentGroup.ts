import { action, computed, observable } from 'mobx';
import { DocumentPresentation, StudentGroup as StudentGroupProps } from '@tdev-api/studentGroup';
import { StudentGroupStore } from '@tdev-stores/StudentGroupStore';
import { formatDateTime } from '@tdev-models/helpers/date';
import User from '@tdev-models/User';
import _ from 'es-toolkit/compat';
import { orderBy } from 'es-toolkit/array';
import { Access } from '@tdev-api/document';

class StudentGroup {
    readonly store: StudentGroupStore;

    readonly id: string;
    @observable accessor name: string;
    @observable accessor description: string;

    userIds = observable.set<string>([]);
    adminIds = observable.set<string>([]);

    @observable accessor parentId: string | null;
    @observable accessor isEditing: boolean = false;
    @observable accessor canPresent: boolean;
    @observable.ref accessor presentedDocumentProps: DocumentPresentation | null = null;

    readonly _pristine: { name: string; description: string };

    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: StudentGroupProps, store: StudentGroupStore) {
        this.store = store;
        this.id = props.id;

        this._pristine = {
            name: props.name,
            description: props.description
        };
        this.name = props.name;
        this.description = props.description;
        this.canPresent = !!props.canPresent;

        this.userIds.replace(props.userIds);
        this.adminIds.replace(props.adminIds);
        this.parentId = props.parentId || null;

        this.updatedAt = new Date(props.updatedAt);
        this.createdAt = new Date(props.createdAt);
        this.setPresentedDocumentProps(props.presentedDocument ?? null);
    }

    get fCreatedAt() {
        return formatDateTime(this.createdAt);
    }

    get fUpdatedAt() {
        return formatDateTime(this.updatedAt);
    }

    @computed
    get students() {
        return orderBy(
            this.store.root.userStore.users.filter((u) => this.userIds.has(u.id) && !this.adminIds.has(u.id)),
            ['firstName', 'lastName'],
            ['asc', 'asc']
        );
    }

    @computed
    get admins() {
        return this.store.root.userStore.users.filter((u) => this.adminIds.has(u.id));
    }

    /**
     * all users - both students and admins - in the group
     */
    @computed
    get users() {
        return [...this.admins, ...this.students];
    }

    @computed
    get searchTerm() {
        return `${this.name} ${this.description}`;
    }

    @computed
    get children() {
        return orderBy(
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
    setCanPresent(canPresent: boolean, skipSave: boolean = false) {
        if (this.canPresent === canPresent || !this.isGroupAdmin) {
            return Promise.resolve(this);
        }
        this.canPresent = canPresent;
        if (!skipSave) {
            return this.save();
        }
        return Promise.resolve(this);
    }

    /**
     * sets the props only locally without saving to the server
     */
    @action
    setPresentedDocumentProps(props: DocumentPresentation | null) {
        if (!this.canPresent || this.presentedDocumentProps === props) {
            return;
        }
        this.presentedDocumentProps = props;
        if (props) {
            this.store.root.documentStore.addPresentedDocumentToStore(this);
            this.store.root.permissionStore.loadPermissions(props.document.documentRootId).catch((err) => {
                console.error('Error loading permissions for presented document', err);
            });
        }
    }

    @action
    async apiSetPresentedDocumentProps(props: DocumentPresentation | null) {
        if (!this.canPresent || this.presentedDocumentProps === props) {
            return;
        }
        const current = this.presentedDocumentProps;
        if (props) {
            const rootId = props.document.documentRootId;
            const docRoot = this.store.root.documentRootStore.find(props.document.documentRootId);
            if (!docRoot) {
                console.error(
                    'Document root not found for presented document',
                    props.document.documentRootId
                );
                return;
            }
            docRoot.setRootAccess(Access.RW_DocumentRoot);
            docRoot.setSharedAccess(Access.RW_DocumentRoot);
            this.setPresentedDocumentProps({
                ...props,
                access: Access.RO_DocumentRoot, // make sure streamed access have by default RO_DocumentRoot access, so that the group can view the document
                sharedAccess: Access.RW_DocumentRoot
            });
            const result = await this.save().catch((err) => {
                console.error('Error saving presented document props', err);
            });
            if (!result) {
                return;
            }
            const groupPermission = this.store.root.permissionStore.createOrUpdateGroupPermission(
                rootId,
                this,
                Access.RO_StudentGroup
            );
            const adminPermissions = this.admins.map((admin) => {
                return this.store.root.permissionStore.createOrUpdateUserPermission(
                    rootId,
                    admin,
                    Access.RW_User
                );
            });
            await Promise.all([groupPermission, ...adminPermissions]).catch((err) => {
                console.error('Error creating admin permissions for presented document', err);
            });
        } else {
            this.setPresentedDocumentProps(null);
            await this.save();
        }
        if (current) {
            await this.cleanupPresentedDocument(current);
        }
    }

    @action
    cleanupPresentedDocument(docProps: DocumentPresentation | null) {
        if (!docProps) {
            return;
        }
        const currentDocRoot = this.store.root.documentRootStore.find(docProps.document.documentRootId);
        return Promise.all([
            currentDocRoot?.setRootAccess(Access.RW_DocumentRoot),
            currentDocRoot?.setSharedAccess(Access.None_DocumentRoot),
            ...this.store.root.permissionStore
                .userPermissionsByDocumentRoot(docProps.document.documentRootId)
                .filter((p) => p.userId && this.userIds.has(p.userId))
                .map((p) => {
                    return this.store.root.permissionStore.deleteUserPermission(p);
                }),
            ...this.store.root.permissionStore
                .groupPermissionsByDocumentRoot(docProps.document.documentRootId)
                .filter((p) => p.groupId === this.id)
                .map((p) => {
                    return this.store.root.permissionStore.deleteGroupPermission(p);
                })
        ]).catch((err) => {
            console.error('Error deleting user permissions for presented document', err);
        });
    }

    @computed
    get permissions() {
        return this.store.root.permissionStore.groupPermissions.filter((p) => p.groupId === this.id);
    }

    @computed
    get presentedDocumentId() {
        return this.presentedDocumentProps?.document.id ?? null;
    }

    @computed
    get presentedDocument() {
        return this.store.root.documentStore.find(this.presentedDocumentId);
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
            parentId: this.parentId,
            canPresent: this.canPresent,
            presentedDocument: this.presentedDocumentProps
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

    @computed
    get studentsWithOptionalPWAuth() {
        return this.students.filter((s) => s.hasEmailPasswordAuth && s.authProviders.length > 1);
    }
}

export default StudentGroup;
