import { RootStore } from '@tdev-stores/rootStore';
import { io, Socket } from 'socket.io-client';
import { action, observable, reaction } from 'mobx';
import { checkLogin as pingApi, default as api } from '@tdev-api/base';
import iStore from '@tdev-stores/iStore';
import {
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
import { BACKEND_URL } from '../authConfig';
import { DocumentRootUpdate } from '@tdev-api/documentRoot';
import { GroupPermission, UserPermission } from '@tdev-api/permission';
import { Document, DocumentType } from '../api/document';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
/**
 * Records that should be created when a IoEvent.NEW_RECORD event is received.
 */
const RecordsToCreate = new Set<DocumentType>([DocumentType.Dir, DocumentType.File, DocumentType.MdxComment]);

export class SocketDataStore extends iStore<'ping'> {
    readonly root: RootStore;

    @observable.ref accessor socket: TypedSocket | undefined = undefined;

    @observable accessor isLive: boolean = false;

    @observable accessor isConfigured = false;

    connectedClients = observable.map<string, number>();

    constructor(root: RootStore) {
        super();
        this.root = root;

        api.interceptors.response.use(
            (res) => res,
            (error) => {
                if (error.response?.status === 401) {
                    this.disconnect();
                }
                return Promise.reject(error);
            }
        );
        reaction(
            () => this.isLive,
            action((isLive) => {
                console.log('Socket.IO live:', isLive);
            })
        );
    }

    @action
    reconnect() {
        this.disconnect();
        this.connect();
    }

    @action
    disconnect() {
        if (this.socket?.connected) {
            this.socket.disconnect();
        }
        this.socket = undefined;
        this.setLiveState(false);
    }

    @action
    setLiveState(isLive: boolean) {
        this.isLive = isLive;
    }

    connect() {
        if (this.socket?.connected) {
            return;
        }
        const ws_url = BACKEND_URL;
        this.socket = io(ws_url, {
            withCredentials: true,
            transports: ['websocket']
        });
        this._socketConfig();
        this.socket.connect();
    }
    _socketConfig() {
        if (!this.socket) {
            return;
        }
        this.socket.on('connect', () => {
            /**
             * maybe there is a newer version to add headers?
             * @see https://socket.io/docs/v4/client-options/#extraheaders
             */
            api.defaults.headers.common['x-metadata-socketid'] = this.socket!.id;
            this.setLiveState(true);
        });

        this.socket.on('disconnect', () => {
            console.log('disconnect', this.socket?.id);
            this.setLiveState(false);
        });
        this.socket.on('connect_error', (err) => {
            console.log('connection error', err);
            this.setLiveState(false);
            this.checkLogin().then((reconnect) => {
                if (reconnect) {
                    this.reconnect();
                }
            });
        });
        this.socket.on(IoEvent.NEW_RECORD, this.createRecord.bind(this));
        this.socket.on(IoEvent.CHANGED_DOCUMENT, this.updateDocument.bind(this));
        this.socket.on(IoEvent.CHANGED_RECORD, this.updateRecord.bind(this));
        this.socket.on(IoEvent.DELETED_RECORD, this.deleteRecord.bind(this));
        this.socket.on(IoEvent.CONNECTED_CLIENTS, this.updateConnectedClients.bind(this));
        this.socket.on(
            IoEvent.USER_MESSAGE,
            this.root.userMessageStore.handleMessage.bind(this.root.userMessageStore)
        );
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
            default:
                console.log('changedRecord', type, record);
                break;
        }
    }

    @action
    updateDocument(change: ChangedDocument) {
        console.log('changedDocument', change.updatedAt, change.id, change.data);
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

    checkLogin() {
        if (this.root.sessionStore.isLoggedIn) {
            return this.withAbortController('ping', (sig) => {
                return pingApi(sig.signal)
                    .then(({ status }) => {
                        if (status === 200 && !this.isLive) {
                            return true;
                        } else {
                            return false;
                        }
                    })
                    .catch((err) => {
                        return false;
                    });
            });
        }
        return Promise.resolve(false);
    }

    @action
    resetUserData() {
        this.disconnect();
        api.defaults.headers.common['x-metadata-socketid'] = undefined;
    }

    @action
    configure() {
        return this.checkLogin()
            .then((reconnect) => {
                if (reconnect) {
                    this.reconnect();
                }
                return [];
            })
            .finally(
                action(() => {
                    this.isConfigured = true;
                })
            );
    }

    @action
    joinRoom(roomId: string) {
        this.socket?.emit(IoClientEvent.JOIN_ROOM, roomId, () => {
            console.log('joined room', roomId);
        });
    }

    @action
    leaveRoom(roomId: string) {
        this.socket?.emit(IoClientEvent.LEAVE_ROOM, roomId, () => {
            console.log('leaved room', roomId);
        });
    }

    @action
    cleanup() {
        this.disconnect();
    }
}
