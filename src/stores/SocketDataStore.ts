import { default as api } from '@tdev-api/base';
import customFields from '@tdev-components/utils/customFields';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import { RegistrationOptions } from '@tdev-stores/utils/RegistrationOptions';
import { authClient } from '@tdev/auth-client';
import { action, computed, observable, observableRef, reaction } from 'mobx';
import { io, Socket } from 'socket.io-client';
import {
    Action,
    AnyRecordType,
    ChangedDocument,
    ChangedRecord,
    ClientToServerEvents,
    ConnectedClients,
    DeletedRecord,
    IoClientEvent,
    IoEvent,
    NewRecord,
    ServerToClientEvents,
    StreamedDynamicDocument,
    TypeRecordMap
} from '../api/IoEventTypes';
import { registerCoreRecordHandlers } from './coreRecordHandlers';
const { OFFLINE_API, BACKEND_URL } = customFields;
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const SOCKET_ID_HEADER = 'x-metadata-sid';

/**
 * Handles the socket events of a record type, see `coreRecordHandlers.ts` for the types of the core.
 */
export interface RecordHandler<T> {
    onNew?: (record: T) => void;
    onChanged?: (record: T) => void;
    onDeleted?: (id: string) => void;
}

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

    connectedClients = observable.map<string, number>();

    private recordHandlers = new Map<AnyRecordType, RecordHandler<any>>();

    constructor(root: RootStore) {
        super();
        this.root = root;
        registerCoreRecordHandlers(this);

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

    /**
     * Registering a type again replaces its previous handler and warns,
     * unless `override` says it is replaced on purpose, e.g. to override a core record type.
     */
    registerRecordHandler<T extends AnyRecordType>(
        type: T,
        handler: RecordHandler<TypeRecordMap[T]>,
        options: RegistrationOptions = {}
    ) {
        if (this.recordHandlers.has(type) && !options.override) {
            console.warn(`Record handler for ${type} is already registered, replacing it`);
        }
        this.recordHandlers.set(type, handler);
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
    createRecord({ type, record }: NewRecord<AnyRecordType>) {
        const onNew = this.recordHandlers.get(type)?.onNew;
        if (!onNew) {
            console.log('newRecord', type, record);
            return;
        }
        onNew(record);
    }

    @action
    updateRecord({ type, record }: ChangedRecord<AnyRecordType>) {
        const onChanged = this.recordHandlers.get(type)?.onChanged;
        if (!onChanged) {
            console.log('changedRecord', type, record);
            return;
        }
        onChanged(record);
    }

    @action
    updateDocument(change: ChangedDocument) {
        this.root.documentStore.handleUpdate(change);
    }

    @action
    deleteRecord({ type, id }: DeletedRecord) {
        const onDeleted = this.recordHandlers.get(type)?.onDeleted;
        if (!onDeleted) {
            console.log('deletedRecord', type, id);
            return;
        }
        onDeleted(id);
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
