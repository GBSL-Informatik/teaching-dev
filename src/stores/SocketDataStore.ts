import { RootStore } from '@tdev-stores/rootStore';
import { io, Socket } from 'socket.io-client';
import { action, observable, reaction } from 'mobx';
import { default as api } from '@tdev-api/base';
import iStore from '@tdev-stores/iStore';
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
    ServerToClientEvents
} from '../api/IoEventTypes';
import { DocumentRoot, DocumentRootUpdate } from '@tdev-api/documentRoot';
import { GroupPermission, UserPermission } from '@tdev-api/permission';
import { Document, DocumentType } from '../api/document';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import { CmsSettings } from '@tdev-api/cms';
import { StudentGroup as ApiStudentGroup } from '@tdev-api/studentGroup';
import StudentGroup from '@tdev-models/StudentGroup';
import siteConfig from '@generated/docusaurus.config';
import { authClient } from '@tdev/auth-client';
import { User } from '@tdev-api/user';
const { OFFLINE_API, BACKEND_URL } = siteConfig.customFields as {
    OFFLINE_API?: boolean | 'memory' | 'indexedDB';
    BACKEND_URL: string;
};

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
/**
 * Records that should be created when a IoEvent.NEW_RECORD event is received.
 */
const RecordsToCreate = new Set<DocumentType>([
    DocumentType.Dir,
    DocumentType.File,
    DocumentType.MdxComment,
    DocumentType.DynamicDocumentRoots,
    DocumentType.TextMessage,
    DocumentType.FlowNode,
    DocumentType.FlowEdge
]);

export class SocketDataStore extends iStore<'ping'> {
    readonly root: RootStore;

    @observable.ref accessor socket: TypedSocket | undefined = undefined;

    @observable accessor isLive: boolean = false;

    @observable.ref accessor actionRequest: Action['action'] | undefined = undefined;

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

    @action
    reconnect() {
        const socket = this.socket;
        this._disconnect(socket);
        this.setLiveState(false);
        this.connect();
    }

    @action
    disconnect() {
        this._disconnect(this.socket);
        this.setLiveState(false);
    }

    @action
    _disconnect(socket: TypedSocket | undefined) {
        if (socket?.connected) {
            socket.disconnect();
        }
        this.socket = undefined;
    }

    @action
    setLiveState(isLive: boolean) {
        this.isLive = isLive;
    }

    async connect() {
        if (OFFLINE_API) {
            if (!this.isLive) {
                this.setLiveState(true);
            }
            return;
        }
        if (this.socket?.connected) {
            return;
        }

        const { data, error } = await authClient.oneTimeToken.generate().catch((e) => {
            return { data: { token: undefined }, error: e };
        });
        if (error || !data?.token) {
            console.log('cannot get one-time-token', error);
            setTimeout(() => this.connect(), 1000);
            return;
        }
        const ws_url = BACKEND_URL;
        const socket = io(ws_url, {
            autoConnect: false,
            auth: {
                token: data.token
            },
            transports: ['websocket', 'webtransport'],
            reconnection: false
        });

        this._connect(socket);
    }

    @action
    _connect(socket: TypedSocket) {
        this._socketConfig(socket);
        const winSock: { tdevSockets?: Socket[] } = window as any;
        winSock.tdevSockets = (winSock.tdevSockets || []).filter((s: Socket) => s.connected || s.active);
        winSock.tdevSockets.forEach((s: Socket) => s.disconnect());
        socket.connect();
        winSock.tdevSockets.push(socket);
    }

    _socketConfig(socket: TypedSocket) {
        if (!socket) {
            return;
        }
        socket.on(
            'connect',
            action(() => {
                if (this.socket) {
                    this._disconnect(this.socket);
                }
                /**
                 * add sid to the api headers, so that the api can broadcast messages to
                 * the user except the initiating client.
                 */
                api.defaults.headers.common['x-metadata-sid'] = socket?.id;
                this.socket = socket;
                this.setLiveState(true);
            })
        );

        socket.on(
            'disconnect',
            action((reason) => {
                this.socket = undefined;
                this.setLiveState(false);
                if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
                    // an error happened, try to reconnect
                    this.reconnect();
                }
            })
        );
        socket.on(
            'connect_error',
            action((err) => {
                console.log('connection error', err);
                // TODO: should we try to connect again in 1s?
            })
        );
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
    }

    /**
     * stream updates to all connected group members (stream to the `documentRootId` id the payload)
     */
    @action
    streamUpdate(roomId: string, payload: ChangedDocument) {
        this.socket?.emit(IoClientEvent.STREAM_UPDATE, { ...payload, roomId });
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
                if (RecordsToCreate.has(doc.type) || doc.parentId) {
                    this.root.documentStore.addToStore(doc);
                }
                break;
            case RecordType.CmsSettings:
                const settings = record as CmsSettings;
                this.root.cmsStore.handleSettingsChange(settings);
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
                            documentRoot: true,
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
                this.root.documentStore.addToStore(record as Document<DocumentType>);
                break;
            case RecordType.CmsSettings:
                this.root.cmsStore.handleSettingsChange(record as CmsSettings);
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
    resetUserData() {
        this.disconnect();
        api.defaults.headers.common['x-metadata-socketid'] = undefined;
    }

    @action
    joinRoom(roomId: string) {
        this.socket?.emit(IoClientEvent.JOIN_ROOM, roomId, (joined) => {
            console.log('joined room', joined ? '✅' : '❌', roomId);
        });
    }

    @action
    leaveRoom(roomId: string) {
        this.socket?.emit(IoClientEvent.LEAVE_ROOM, roomId, (left: boolean) => {
            console.log('left room', left ? '✅' : '❌', roomId);
        });
    }

    @action
    requestNavigation(roomIds: string[], userIds: string[], action: Action['action']) {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve(false);
        }
        return new Promise((resolve) => {
            this.socket?.emit(IoClientEvent.ACTION, { roomIds, userIds, action }, (ok) => {
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
    }
}
