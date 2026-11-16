import { default as api } from '@tdev-api/base';
import { CmsSettings } from '@tdev-api/cms';
import { DocumentRoot, DocumentRootUpdate } from '@tdev-api/documentRoot';
import { GroupPermission, UserPermission } from '@tdev-api/permission';
import { StudentGroup as ApiStudentGroup } from '@tdev-api/studentGroup';
import { User } from '@tdev-api/user';
import customFields from '@tdev-components/utils/customFields';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import StudentGroup from '@tdev-models/StudentGroup';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import { authClient } from '@tdev/auth-client';
import { action, computed, observable, observableRef, reaction } from 'mobx';
import { io, Socket } from 'socket.io-client';
import { Document, DocumentType, type ViewStoreTypeMapping } from '../api/document';
import {
    Action,
    ChangedDocument,
    ChangedRecord,
    ClientToServerEvents,
    ConnectedClients,
    DeletedRecord,
    IoClientEvent,
    IoEvent,
    NewRecord,
    RecordType,
    ServerToClientEvents,
    StreamedDynamicDocument
} from '../api/IoEventTypes';
const { OFFLINE_API, BACKEND_URL } = customFields;
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const SOCKET_ID_HEADER = 'x-metadata-sid';
/**
 * Records that should be created when a IoEvent.NEW_RECORD event is received.
 */
const RecordsToCreate: DocumentType[] = ['dir', 'file', 'mdx_comment', 'dynamic_document_roots'] as const;
type PrimitiveCmsStore = { handleSettingsChange: (settings: CmsSettings) => void };

const fetchSocketAuth = async (): Promise<{ token?: string }> => {
    const { data, error } = await authClient.oneTimeToken.generate().catch((e) => {
        return { data: undefined, error: e };
    });
    if (error || !data?.token) {
        console.log('cannot get one-time-token', error);
        return {};
    }
    return { token: data.token };
};

export class SocketDataStore extends iStore<'ping'> {
    readonly root: RootStore;

    /**
     * The only socket of the app: socket.io reconnects it on its own, it is
     * only replaced after cleanup().
     */
    private socket: TypedSocket | undefined = undefined;

    /**
     * Only set between the socket's 'connect' and 'disconnect' events, so `isLive` can be derived from it.
     */
    @observable accessor socketId: string | undefined = undefined;

    @observableRef accessor actionRequest: Action['action'] | undefined = undefined;

    recordsToCreate = observable.set<DocumentType>(RecordsToCreate);

    connectedClients = observable.map<string, number>();

    constructor(root: RootStore) {
        super();
        this.root = root;

        reaction(
            () => this.isLive,
            action((isLive) => {
                if (!OFFLINE_API) {
                    console.log('Socket.IO live:', isLive);
                }
            })
        );
    }

    @computed
    get isLive() {
        return !!OFFLINE_API || this.socketId !== undefined;
    }

    @action
    registerRecordToCreate(docType: DocumentType) {
        this.recordsToCreate.add(docType);
    }

    /**
     * Safe to call at any time: does nothing while the socket is connected
     * or socket.io is already reconnecting it.
     */
    connect() {
        if (OFFLINE_API) {
            return;
        }
        if (!this.socket) {
            this.socket = this.createSocket();
        }
        if (this.socket.active) {
            return;
        }
        this.socket.connect();
    }

    disconnect() {
        this.socket?.disconnect();
    }

    /**
     * Reconnects with a fresh one-time token, e.g. after the current user changed.
     */
    reconnect() {
        this.disconnect();
        this.connect();
    }

    /**
     * stream updates to all connected group members (stream to the `roomId`
     * in the payload, which usually is a documentRootId)
     */
    @action
    streamUpdate<T extends Record<string, unknown>>(
        roomId: string,
        payload: Omit<ChangedDocument, 'updatedAt'>,
        meta?: T
    ) {
        const data: StreamedDynamicDocument<T> = {
            ...payload,
            roomId
        };
        if (meta) {
            data.meta = meta;
        }
        this.connectedSocket?.emit(IoClientEvent.STREAM_UPDATE, data);
    }

    @action
    createRecord({ type, record }: NewRecord<RecordType>) {
        switch (type) {
            case RecordType.UserPermission:
                this.root.permissionStore.handleUserPermissionUpdate(record as UserPermission);
                break;
            case RecordType.GroupPermission:
                this.root.permissionStore.handleGroupPermissionUpdate(record as GroupPermission);
                break;
            case RecordType.Document:
                const doc = record as Document<any>;
                if (this.recordsToCreate.has(doc.type) || doc.parentId) {
                    this.root.documentStore.addToStore(doc);
                }
                if (
                    this.root.userStore.isUserSwitched &&
                    doc.authorId === this.root.userStore.viewedUserId &&
                    this.root.documentRootStore.find(doc.documentRootId)
                ) {
                    this.root.documentStore.addToStore(doc);
                }
                break;
            case RecordType.CmsSettings:
                const settings = record as CmsSettings;
                if (!this.root.viewStore.stores.has('cmsStore' as keyof ViewStoreTypeMapping)) {
                    console.log('cmsStore not registered yet, skipping settings update');
                    return;
                }
                const cmsStore = this.root.viewStore.useStore('cmsStore' as keyof ViewStoreTypeMapping);
                (cmsStore as unknown as PrimitiveCmsStore).handleSettingsChange(settings);
                break;
            case RecordType.StudentGroup:
                const studentGroup = record as ApiStudentGroup;
                try {
                    const newGroup = new StudentGroup(studentGroup, this.root.studentGroupStore);
                    this.root.studentGroupStore.addToStore(newGroup);
                    this.joinRoom(newGroup.id);
                } catch (e) {
                    console.error('Error creating student group', e);
                }
                break;
            case RecordType.DocumentRoot:
                const docRoot = record as DocumentRoot;
                const current = this.root.documentRootStore.find(docRoot.id);
                /**
                 * this would be a dummy document root - this only happens in cases
                 * where only admins are allowed to create document roots, e.g. for
                 * message rooms.
                 */
                if (current) {
                    this.root.documentRootStore.addApiResultToStore(docRoot, {
                        meta: current.meta,
                        load: {
                            documentRoot: 'replace',
                            documents: NoneAccess.has(
                                current.permission
                            ) /** only load the documents, when the current permission is None */,
                            groupPermissions: true,
                            userPermissions: true
                        }
                    });
                }
                break;
            default:
                console.log('newRecord', type, record);
                break;
        }
    }

    @action
    updateRecord({ type, record }: ChangedRecord<RecordType>) {
        switch (type) {
            case RecordType.DocumentRoot:
                this.root.documentRootStore.handleUpdate(record as DocumentRootUpdate);
                break;
            case RecordType.UserPermission:
                this.root.permissionStore.handleUserPermissionUpdate(record as UserPermission);
                break;
            case RecordType.GroupPermission:
                this.root.permissionStore.handleGroupPermissionUpdate(record as GroupPermission);
                break;
            case RecordType.Document:
                this.root.documentStore.addToStore(record as Document<DocumentType>, true);
                break;
            case RecordType.CmsSettings:
                if (!this.root.viewStore.stores.has('cmsStore' as keyof ViewStoreTypeMapping)) {
                    console.log('cmsStore not registered yet, skipping settings update');
                    return;
                }
                const cmsStore = this.root.viewStore.useStore('cmsStore' as keyof ViewStoreTypeMapping);
                (cmsStore as unknown as PrimitiveCmsStore).handleSettingsChange(record as CmsSettings);
                break;
            case RecordType.StudentGroup:
                const studentGroup = record as ApiStudentGroup;
                this.root.studentGroupStore.handleUpdate(studentGroup);
                break;
            case RecordType.User:
                this.root.userStore.addToStore(record as User);
                break;
            default:
                console.log('changedRecord', type, record);
                break;
        }
    }

    @action
    updateDocument(change: ChangedDocument) {
        this.root.documentStore.handleUpdate(change);
    }

    @action
    deleteRecord({ type, id }: DeletedRecord) {
        switch (type) {
            case RecordType.UserPermission:
                const currentUP = this.root.permissionStore.findUserPermission(id);
                this.root.permissionStore.removeFromStore(currentUP);
                break;
            case RecordType.GroupPermission:
                const currentGP = this.root.permissionStore.findGroupPermission(id);
                this.root.permissionStore.removeFromStore(currentGP);
                break;
            case RecordType.Document:
                const currentDoc = this.root.documentStore.find(id);
                this.root.documentStore.removeFromStore(currentDoc, true);
                break;
            case RecordType.StudentGroup:
                const currentGroup = this.root.studentGroupStore.find(id);
                if (this.root.userStore.current?.isAdmin && currentGroup?.userIds?.size) {
                    /** admins always display all groups with some members, no matter what */
                    return;
                }
                this.root.studentGroupStore.removeFromStore(currentGroup);
                this.leaveRoom(id);
                break;
            default:
                console.log('deletedRecord', type, id);
                break;
        }
    }

    @action
    updateConnectedClients(data: ConnectedClients) {
        if (data.type === 'full') {
            this.connectedClients.replace(data.rooms);
        } else {
            data.rooms.forEach(([room, count]) => {
                this.connectedClients.set(room, count);
            });
        }
    }

    @action
    joinRoom(roomId: string) {
        this.connectedSocket?.emit(IoClientEvent.JOIN_ROOM, roomId, (joined) => {
            console.log('joined room', joined ? '✅' : '❌', roomId);
        });
    }

    @action
    leaveRoom(roomId: string) {
        this.connectedSocket?.emit(IoClientEvent.LEAVE_ROOM, roomId, (left: boolean) => {
            console.log('left room', left ? '✅' : '❌', roomId);
        });
    }

    @action
    requestNavigation(roomIds: string[], userIds: string[], action: Action['action']) {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve(false);
        }
        return new Promise((resolve) => {
            this.connectedSocket?.emit(IoClientEvent.ACTION, { roomIds, userIds, action }, (ok) => {
                resolve(ok);
            });
        });
    }

    @action
    requestReload(roomIds: string[], userIds: string[]) {
        return this.requestNavigation(roomIds || [], userIds || [], { type: 'nav-reload' });
    }

    @action
    cleanup() {
        this.disconnect();
        this.socket = undefined;
    }

    private createSocket(): TypedSocket {
        const socket: TypedSocket = io(BACKEND_URL, {
            autoConnect: false,
            // socket.io calls this on every (re)connect, so each attempt sends a fresh one-time token
            auth: (cb) => fetchSocketAuth().then(cb),
            transports: ['websocket', 'webtransport']
        });
        socket.on(
            'connect',
            action(() => {
                // lets the api broadcast changes to all clients of the user except the initiating one
                api.defaults.headers.common[SOCKET_ID_HEADER] = socket.id;
                this.socketId = socket.id;
            })
        );
        socket.on(
            'disconnect',
            // The api rejects an invalid one-time token with an 'io server disconnect', which socket.io
            // does not retry: a new login or the LivenessChecker in Root.tsx reconnects.
            action(() => {
                delete api.defaults.headers.common[SOCKET_ID_HEADER];
                this.socketId = undefined;
            })
        );
        socket.on('connect_error', (err) => {
            console.log('connection error', err);
        });
        socket.on(IoEvent.NEW_RECORD, this.createRecord.bind(this));
        socket.on(IoEvent.CHANGED_DOCUMENT, this.updateDocument.bind(this));
        socket.on(IoEvent.CHANGED_RECORD, this.updateRecord.bind(this));
        socket.on(IoEvent.DELETED_RECORD, this.deleteRecord.bind(this));
        socket.on(IoEvent.CONNECTED_CLIENTS, this.updateConnectedClients.bind(this));
        socket.on(
            IoEvent.ACTION,
            action((data: Action['action']) => {
                this.actionRequest = data;
            })
        );
        return socket;
    }

    /**
     * socket.io buffers emits while disconnected: drop them instead, they would be stale on reconnect.
     */
    private get connectedSocket() {
        return this.socket?.connected ? this.socket : undefined;
    }
}
