import { action, computed, IReactionDisposer, observable, reaction, set } from 'mobx';
import { Document as DocumentProps, TypeDataMapping, DocumentType } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import _ from 'es-toolkit/compat';
import { ApiState } from '@tdev-stores/iStore';
import { NoneAccess, ROAccess, RWAccess } from './helpers/accessPolicy';
import type iSideEffect from './SideEffects/iSideEffect';
import { DUMMY_DOCUMENT_ID } from '@tdev-hooks/useFirstMainDocument';
import { isDummyId, isTempId } from '@tdev-hooks/useDummyId';

/**
 * normally, save only once all 1000ms
 */
const SAVE_DEBOUNCE_TIME = 1000;

export enum Source {
    LOCAL = 'local',
    API = 'api'
}
abstract class iDocument<Type extends DocumentType> {
    readonly store: DocumentStore;
    readonly id: string;
    readonly authorId: string;
    readonly parentId: string | null | undefined;
    readonly documentRootId: string;
    readonly type: Type;
    @observable.ref accessor _pristine: TypeDataMapping[Type];

    readonly createdAt: Date;

    /**
     * save the model only after 1 second of "silence" (=no edits during this period)
     * or after 5s of permanent editing...
     *
     * Save     :                  v                                                v
     * Time [s] :    0        1        2        3        4        5        6        7
     * Edits    :    |||  |            |||   ||  |  |     ||  ||||  |||    ||  ||| |||||
     */
    save = _.debounce(action(this._save), SAVE_DEBOUNCE_TIME, {
        leading: false,
        trailing: true,
        maxWait: 5 * SAVE_DEBOUNCE_TIME
    });

    @observable accessor state: ApiState = ApiState.IDLE;

    sideEffects = observable.array<iSideEffect<Type>>([], { deep: false });

    @observable.ref accessor updatedAt: Date;
    readonly stateDisposer: IReactionDisposer;
    constructor(props: DocumentProps<Type>, store: DocumentStore) {
        this.store = store;
        this.id = props.id;
        this.authorId = props.authorId;
        this.parentId = props.parentId;
        this.documentRootId = props.documentRootId;
        this.type = props.type;
        this._pristine = props.data || {};

        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
        this.stateDisposer = reaction(
            () => this.state,
            (state) => {
                if (state !== ApiState.IDLE) {
                    const cancelId = setTimeout(
                        action(() => {
                            this.state = ApiState.IDLE;
                        }),
                        1500
                    );
                    return () => {
                        clearTimeout(cancelId);
                    };
                }
            }
        );
    }

    get isLoadable() {
        return !isTempId(this.id) && this.store.canSave;
    }

    @computed
    get props(): DocumentProps<Type> {
        return {
            id: this.id,
            authorId: this.authorId,
            parentId: this.parentId,
            documentRootId: this.documentRootId,
            type: this.type,
            data: this.data,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    @action
    reset() {
        this.setData({ ...this._pristine }, Source.LOCAL);
    }

    @action
    registerSideEffect(se: iSideEffect<Type>) {
        const old = this.sideEffects.find((s) => s.name === se.name);
        if (old) {
            this.sideEffects.remove(old);
        }
        this.sideEffects.push(se);
    }

    abstract get data(): TypeDataMapping[Type];

    abstract setData(data: TypeDataMapping[Type], from: Source, updatedAt?: Date): void;

    @computed
    get derivedData() {
        return this.sideEffects.reduce((acc, se) => {
            return se.transformer(acc);
        }, this.data);
    }

    @computed
    get isDirty() {
        return !_.isEqual(this._pristine, this.data);
    }

    @computed
    get isMain() {
        return !this.parentId && this.root?.type === this.type;
    }

    @computed
    get root() {
        return this.store.root.documentRootStore.find(this.documentRootId);
    }

    @computed
    get parent() {
        return this.store.find(this.parentId);
    }

    @computed
    get children() {
        return this.store.byParentId(this.id);
    }

    get isInitialized() {
        /**
         * only return true if the models root document is present in the store...
         * -> maybe the root document is not yet loaded, then this model
         *   should not be displayed...
         */
        return !!this.root && this.root.isLoaded;
    }

    @computed
    get canEdit() {
        if (!this.root) {
            return false;
        }
        if (this.sideEffects.some((se) => !se.canEdit)) {
            return false;
        }
        if (ROAccess.has(this.root.meta.access)) {
            return false;
        }
        if (this.root.isDummy) {
            return RWAccess.has(this.root.permission);
        }
        if (!this.store.root.userStore.current) {
            return RWAccess.has(this.root.access);
        }
        const userId = this.store.root.userStore.current?.id;
        if (this.authorId === userId) {
            return RWAccess.has(this.root.permission);
        }
        return RWAccess.has(this.root.sharedAccess) && RWAccess.has(this.root.permission);
    }

    @computed
    get canDisplay() {
        if (!this.root) {
            return true;
        }
        if (!this.store.root.userStore.current) {
            return !NoneAccess.has(this.root.permission);
        }
        const userId = this.store.root.userStore.current?.id;
        if (NoneAccess.has(this.root.permission)) {
            return false;
        }
        if (this.authorId === userId) {
            return true;
        }
        return !NoneAccess.has(this.root.sharedAccess);
    }

    get author() {
        return this.store.root.userStore.find(this.authorId);
    }

    @action
    cleanup(deep?: boolean) {
        /**
         * cancel pending actions and cleanup if needed...
         */
        this.stateDisposer();
        if (deep) {
            this.children.forEach((c) => {
                this.store.removeFromStore(c);
            });
        }
    }

    @action
    saveNow() {
        this.save();
        return this.save.flush();
    }

    @action
    _save(onBeforeSave: () => Promise<void> = () => Promise.resolve()) {
        /**
         * call the api to save the code...
         */
        this.state = ApiState.SYNCING;
        return onBeforeSave()
            .then(() => {
                return this.store.save(this).then(
                    action((res) => {
                        if (res === 'error') {
                            this.state = ApiState.ERROR;
                        } else {
                            this.state = ApiState.SUCCESS;
                            if (this.isDirty) {
                                this._pristine = { ...this.data };
                            }
                        }
                    })
                );
            })
            .catch((e) => {
                console.warn('OnBeforeSave failed for', this.id, e);
            });
    }
}

export default iDocument;
