import { RootStore } from './rootStore';
import { io, Socket } from 'socket.io-client';
import { action, observable, reaction } from 'mobx';
import { checkLogin as pingApi, default as api } from '../api/base';
import iStore from './iStore';
import {
    ChangedDocument,
    ChangedRecord,
    ClientToServerEvents,
    ConnectedClients,
    DeletedRecord,
    IoEvent,
    NewRecord,
    RecordType,
    ServerToClientEvents
} from '../api/IoEventTypes';
import { BACKEND_URL } from '../authConfig';
import { DocumentRootUpdate } from '@site/src/api/documentRoot';
import { GroupPermission, UserPermission } from '@site/src/api/permission';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

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
    }

    @action
    createRecord({ type, record }: NewRecord<RecordType>) {
        console.log('createRecord', type, record);
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
                // TODO: Do we also need to update all docs / doc roots?
                this.root.permissionStore.deleteUserPermission(id);
                break;
            case RecordType.GroupPermission:
                // TODO: Do we also need to update all docs / doc roots?
                this.root.permissionStore.deleteGroupPermission(id);
                break;
            default:
                console.log('deletedRecord', type, id);
                break;
        }
    }

    @action
    updateConnectedClients({ room, count }: ConnectedClients) {
        this.connectedClients.set(room, count);
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
    cleanup() {
        this.disconnect();
    }
}
