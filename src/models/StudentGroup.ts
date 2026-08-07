import { action, computed, observable, observableRef } from 'mobx';
import { DocumentPresentation, StudentGroup as StudentGroupProps } from '@tdev-api/studentGroup';
import { StudentGroupStore } from '@tdev-stores/StudentGroupStore';
import { formatDateTime } from '@tdev-models/helpers/date';
import User from '@tdev-models/User';
import _ from 'es-toolkit/compat';
import { orderBy } from 'es-toolkit/array';
import { Access, type TypeModelMapping, type DocumentModelType } from '@tdev-api/document';
import type DocumentRoot from './DocumentRoot';

class StudentGroup {
    readonly store: StudentGroupStore;

    readonly id: string;
    @observable accessor name: string;
    @observable accessor description: string;

    userIds = observable.set<string>([]);
    adminIds = observable.set<string>([]);

    @observable accessor parentId: string | null;
    @observable accessor isEditing: boolean = false;
    @observable accessor _canPresent: boolean;
    @observableRef accessor presentedDocumentProps: DocumentPresentation | null = null;

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
        this._canPresent = !!props.canPresent;

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

    @computed
    get canPresent() {
        const user = this.store.root.userStore.current;
        // admins can fetch every student group, but they can only present the groups they are a member of
        if (user?.isAdmin) {
            if (!this.userIds.has(user.id)) {
                return false;
            }
        }
        return this._canPresent;
    }

    @action
    setCanPresent(canPresent: boolean, skipSave: boolean = false) {
        if (this._canPresent === canPresent || !this.isGroupAdmin) {
            return Promise.resolve(this);
        }
        this._canPresent = canPresent;
        if (!skipSave) {
            return this.save();
        }
        return Promise.resolve(this);
    }

    @action
    setPresentingUsersVisibility(isVisible: boolean) {
        if (!this.presentedDocumentProps) {
            return;
        }
        this.presentedDocumentProps = {
            ...this.presentedDocumentProps,
            hidePresentingUsers: !isVisible
        };
        return this.save();
    }

    @action
    setPresentedDocumentRemoteExecutionPolicy(canExecute: boolean) {
        if (!this.presentedDocumentProps) {
            return;
        }
        this.presentedDocumentProps = {
            ...this.presentedDocumentProps,
            allowRemoteExecution: canExecute
        };
        return this.save();
    }

    @computed
    get isRemoteExecutionAllowed() {
        return this.presentedDocumentProps?.allowRemoteExecution ?? false;
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
            // only admins will load permissions...
            this.store.root.permissionStore
                .loadAllPermissions([props.document.documentRootId])
                .catch((err) => {
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
            const docRoot = this.store.root.documentRootStore.find(rootId);
            if (!docRoot) {
                return console.error('Document root not found for presented document', rootId);
            }
            await this._setupPresentedDocument(docRoot, props);
            if (!current || current.document.id !== props.document.id) {
                this.presentedDocument?.streamUpdate();
            }
        } else {
            this.setPresentedDocumentProps(null);
            await this.save();
        }
        if (current) {
            await this._cleanupPresentedDocument(current);
        }
    }

    @action
    async _setupPresentedDocument(
        documentRoot: DocumentRoot<keyof TypeModelMapping>,
        props: DocumentPresentation
    ) {
        documentRoot.setRootAccess(Access.RW_DocumentRoot, true);
        await documentRoot.setSharedAccess(Access.RW_DocumentRoot);
        const minus1ms = new Date(new Date(props.document.updatedAt).getTime() - 1);
        // ensure current document is not displayed as stale
        const docProps = { ...props.document, updatedAt: minus1ms.toISOString() };
        this.setPresentedDocumentProps({
            ...props,
            document: docProps,
            access: Access.RO_DocumentRoot, // make sure streamed access have by default RO_DocumentRoot access, so that the group can view the document
            sharedAccess: Access.RW_DocumentRoot
        });
        const result = await this.save().catch((err) => {
            console.error('Error saving presented document props', err);
        });
        if (!result) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        const groupPermission = this.store.root.permissionStore.createOrUpdateGroupPermission(
            documentRoot.id,
            this,
            Access.RO_StudentGroup
        );
        // wait 500ms to ensure the document is distributed to all clients before setting up permissions
        const adminPermissions = this.admins.map((admin) => {
            return this.store.root.permissionStore.createOrUpdateUserPermission(
                documentRoot.id,
                admin,
                Access.RW_User
            );
        });
        await Promise.all([groupPermission, ...adminPermissions]).catch((err) => {
            console.error('Error creating admin permissions for presented document', err);
        });
    }

    @action
    _cleanupPresentedDocument(docProps: DocumentPresentation | null) {
        if (!docProps) {
            return;
        }
        const currentDocRoot = this.store.root.documentRootStore.find(docProps.document.documentRootId);
        currentDocRoot?.setRootAccess(Access.RW_DocumentRoot, true);
        return Promise.all([
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
        if (!this.canPresent) {
            return null;
        }
        return this.presentedDocumentProps?.document.id ?? null;
    }

    @computed
    get presentedDocument(): DocumentModelType | undefined {
        return this.store.root.documentStore.find(this.presentedDocumentId);
    }

    @computed
    get isPresentedDocumentStale() {
        if (!this.presentedDocumentProps || !this.presentedDocument) {
            return true;
        }
        return (
            this.presentedDocument.updatedAt.toISOString() === this.presentedDocumentProps.document.updatedAt
        );
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
            canPresent: this._canPresent,
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
