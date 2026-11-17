import { Document, DocumentType } from '@tdev-api/document';
import { DocumentRoot } from '@tdev-api/documentRoot';
import { RecordType } from '@tdev-api/IoEventTypes';
import { StudentGroup as ApiStudentGroup } from '@tdev-api/studentGroup';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import StudentGroup from '@tdev-models/StudentGroup';
import type { SocketDataStore } from '../SocketDataStore';

/**
 * Registers the handlers for the record types of the core. Packages register theirs the same way.
 */
export const registerCoreRecordHandlers = (socketStore: SocketDataStore) => {
    const { root } = socketStore;

    socketStore.registerRecordHandler(RecordType.User, {
        onChanged: (user) => root.userStore.addToStore(user)
    });

    socketStore.registerRecordHandler(RecordType.UserPermission, {
        onNew: (permission) => root.permissionStore.handleUserPermissionUpdate(permission),
        onChanged: (permission) => root.permissionStore.handleUserPermissionUpdate(permission),
        onDeleted: (id) => root.permissionStore.removeFromStore(root.permissionStore.findUserPermission(id))
    });

    socketStore.registerRecordHandler(RecordType.GroupPermission, {
        onNew: (permission) => root.permissionStore.handleGroupPermissionUpdate(permission),
        onChanged: (permission) => root.permissionStore.handleGroupPermissionUpdate(permission),
        onDeleted: (id) => root.permissionStore.removeFromStore(root.permissionStore.findGroupPermission(id))
    });

    socketStore.registerRecordHandler(RecordType.Document, {
        onNew: (doc) => handleNewDocument(socketStore, doc),
        onChanged: (doc) => root.documentStore.addToStore(doc, true),
        onDeleted: (id) => root.documentStore.removeFromStore(root.documentStore.find(id), true)
    });

    socketStore.registerRecordHandler(RecordType.DocumentRoot, {
        // NEW_RECORD sends the full document root, CHANGED_RECORD only the changed access
        onNew: (docRoot) => handleNewDocumentRoot(socketStore, docRoot as DocumentRoot),
        onChanged: (update) => root.documentRootStore.handleUpdate(update)
    });

    socketStore.registerRecordHandler(RecordType.StudentGroup, {
        onNew: (group) => handleNewStudentGroup(socketStore, group),
        onChanged: (group) => root.studentGroupStore.handleUpdate(group),
        onDeleted: (id) => handleDeletedStudentGroup(socketStore, id)
    });
};

const handleNewDocument = (socketStore: SocketDataStore, doc: Document<DocumentType>) => {
    const { root } = socketStore;
    if (root.documentStore.isCreatedOnNewRecord(doc.type) || doc.parentId) {
        root.documentStore.addToStore(doc);
    }
    const isDocOfViewedUser =
        root.userStore.isUserSwitched &&
        doc.authorId === root.userStore.viewedUserId &&
        !!root.documentRootStore.find(doc.documentRootId);
    if (isDocOfViewedUser) {
        root.documentStore.addToStore(doc);
    }
};

const handleNewDocumentRoot = (socketStore: SocketDataStore, docRoot: DocumentRoot) => {
    const { documentRootStore } = socketStore.root;
    const current = documentRootStore.find(docRoot.id);
    /**
     * this would be a dummy document root - this only happens in cases
     * where only admins are allowed to create document roots, e.g. for
     * message rooms.
     */
    if (!current) {
        return;
    }
    documentRootStore.addApiResultToStore(docRoot, {
        meta: current.meta,
        load: {
            documentRoot: 'replace',
            /** only load the documents, when the current permission is None */
            documents: NoneAccess.has(current.permission),
            groupPermissions: true,
            userPermissions: true
        }
    });
};

const handleNewStudentGroup = (socketStore: SocketDataStore, group: ApiStudentGroup) => {
    const { studentGroupStore } = socketStore.root;
    try {
        const newGroup = new StudentGroup(group, studentGroupStore);
        studentGroupStore.addToStore(newGroup);
        socketStore.joinRoom(newGroup.id);
    } catch (e) {
        console.error('Error creating student group', e);
    }
};

const handleDeletedStudentGroup = (socketStore: SocketDataStore, id: string) => {
    const { root } = socketStore;
    const currentGroup = root.studentGroupStore.find(id);
    if (root.userStore.current?.isAdmin && currentGroup?.userIds?.size) {
        /** admins always display all groups with some members, no matter what */
        return;
    }
    root.studentGroupStore.removeFromStore(currentGroup);
    socketStore.leaveRoom(id);
};
