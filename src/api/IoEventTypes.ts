import { User } from '../api/user';
import { Document, DocumentType } from '../api/document';
import { rootStore } from '../stores/rootStore';
import { GroupPermission, UserPermission } from '../api/permission';
import { DocumentRootUpdate } from '../api/documentRoot';
import { CmsSettings } from './cms';
import { StudentGroup } from './studentGroup';

export enum IoEvent {
    NEW_RECORD = 'NEW_RECORD',
    CHANGED_RECORD = 'CHANGED_RECORD',
    CHANGED_DOCUMENT = 'CHANGED_DOCUMENT',
    DELETED_RECORD = 'DELETED_RECORD',
    CONNECTED_CLIENTS = 'CONNECTED_CLIENTS',
    ACTION = 'ACTION'
}

export enum RecordType {
    Document = 'Document',
    User = 'User',
    UserPermission = 'UserPermission',
    GroupPermission = 'GroupPermission',
    DocumentRoot = 'DocumentRoot',
    StudentGroup = 'StudentGroup',
    CmsSettings = 'CmsSettings'
}

type TypeRecordMap = {
    [RecordType.Document]: Document<DocumentType>;
    [RecordType.User]: User;
    [RecordType.UserPermission]: UserPermission;
    [RecordType.GroupPermission]: GroupPermission;
    [RecordType.DocumentRoot]: DocumentRootUpdate;
    [RecordType.CmsSettings]: CmsSettings;
    [RecordType.StudentGroup]: StudentGroup;
};

export interface NewRecord<T extends RecordType> {
    type: T;
    record: TypeRecordMap[T];
}

export interface ChangedRecord<T extends RecordType> {
    type: T;
    record: TypeRecordMap[T];
}

export interface ChangedDocument {
    id: string;
    data: Object;
    updatedAt: string;
}

export interface StreamedDynamicDocument extends ChangedDocument {
    roomId: string;
}

export interface ConnectedClients {
    rooms: [string, number][];
    type: 'full' | 'update';
}

export interface DeletedRecord {
    type: RecordType;
    id: string;
}

interface NotificationBase {
    to: string | string[];
    toSelf?: true | boolean;
}

interface NotificationNewRecord extends NotificationBase {
    event: IoEvent.NEW_RECORD;
    message: NewRecord<RecordType>;
}

interface NotificationChangedRecord extends NotificationBase {
    event: IoEvent.CHANGED_RECORD;
    message: ChangedRecord<RecordType>;
}

interface NotificationDeletedRecord extends NotificationBase {
    event: IoEvent.DELETED_RECORD;
    message: DeletedRecord;
}
interface NotificationChangedDocument extends NotificationBase {
    event: IoEvent.CHANGED_DOCUMENT;
    message: ChangedDocument;
}

export type Notification =
    | NotificationNewRecord
    | NotificationChangedRecord
    | NotificationDeletedRecord
    | NotificationChangedDocument;

interface ActionNavigationReload {
    type: 'nav-reload';
}
interface ActionNavigationTarget {
    type: 'nav-target';
    target: string;
}

// actions can be extended client side - the server only delegates the action, but the
// content of the action is never checked by the server
export type Actions = ActionNavigationReload | ActionNavigationTarget;

export interface Action<T = Actions> {
    action: T;
    roomIds: string[];
    userIds: string[];
}

/**
 * client side initiated events
 */

export enum IoClientEvent {
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    STREAM_UPDATE = 'STREAM_UPDATE',
    ACTION = 'ACTION'
}

export type ServerToClientEvents = {
    [IoEvent.NEW_RECORD]: (message: NewRecord<RecordType>) => void;
    [IoEvent.CHANGED_RECORD]: (message: ChangedRecord<RecordType>) => void;
    [IoEvent.DELETED_RECORD]: (message: DeletedRecord) => void;
    [IoEvent.CHANGED_DOCUMENT]: (message: ChangedDocument) => void;
    [IoEvent.CONNECTED_CLIENTS]: (message: ConnectedClients) => void;
    [IoEvent.ACTION]: (message: Action['action']) => void;
};

export interface ClientToServerEvents {
    [IoClientEvent.JOIN_ROOM]: (roomId: string, callback: (joined: boolean) => void) => void;
    [IoClientEvent.LEAVE_ROOM]: (roomId: string, callback: (left: boolean) => void) => void;
    [IoClientEvent.ACTION]: (action: Action, callback: (ok: boolean) => void) => void;
    [IoClientEvent.STREAM_UPDATE]: (payload: StreamedDynamicDocument) => void;
}

export const RecordStoreMap: { [key in RecordType]: keyof typeof rootStore } = {
    User: 'userStore',
    Document: 'documentRootStore',
    UserPermission: 'permissionStore',
    GroupPermission: 'permissionStore',
    DocumentRoot: 'documentRootStore',
    CmsSettings: 'cmsStore',
    StudentGroup: 'studentGroupStore'
} as const;
