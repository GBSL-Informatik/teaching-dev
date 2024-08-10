import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import { Document as DocumentProps, TypeDataMapping, DocumentType, Access } from '../api/document';
import DocumentStore from '../stores/DocumentStore';
import { debounce } from 'lodash';
import { ApiState } from '../stores/iStore';

/**
 * normally, save only once all 1000ms
 */
const SAVE_DEBOUNCE_TIME = 1000;
abstract class iDocument<Type extends DocumentType> {
    readonly store: DocumentStore;
    readonly id: string;
    readonly authorId: string;
    readonly parentId: string | null | undefined;
    readonly documentRootId: string;
    readonly type: Type;
    readonly _pristine: TypeDataMapping[Type];

    readonly createdAt: Date;
    /**
     * save the model only after 1 second of "silence" (=no edits during this period)
     * or after 5s of permanent editing...
     *
     * Save     :                  v                                                v
     * Time [s] :    0        1        2        3        4        5        6        7
     * Edits    :    |||  |            |||   ||  |  |     ||  ||||  |||    ||  ||| |||||
     */
    save = debounce(action(this._save), SAVE_DEBOUNCE_TIME, {
        leading: false,
        trailing: true,
        maxWait: 5 * SAVE_DEBOUNCE_TIME
    });

    @observable accessor state: ApiState = ApiState.IDLE;

    @observable.ref accessor updatedAt: Date;
    readonly stateDisposer: IReactionDisposer;
    constructor(props: DocumentProps<Type>, store: DocumentStore) {
        this.store = store;
        this.id = props.id;
        this.authorId = props.authorId;
        this.parentId = props.parentId;
        this.documentRootId = props.documentRootId;
        this.type = props.type;
        this._pristine = props.data;

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
        this.setData({ ...this._pristine }, true);
    }

    abstract get data(): TypeDataMapping[Type];

    abstract setData(data: TypeDataMapping[Type], persist: boolean, updatedAt?: Date): void;

    @computed
    get isDirty() {
        return this._pristine !== this.data;
    }

    @computed
    get isMain() {
        return !this.parentId && this.root?.type === this.type;
    }

    @computed
    get root() {
        return this.store.root.documentRootStore.find(this.documentRootId);
    }

    get isInitialized() {
        /**
         * only return true if the models root document is present in the store...
         * -> maybe the root document is not yet loaded, then this model
         *   should not be displayed...
         */
        return !!this.root;
    }

    @computed
    get canEdit() {
        if (!this.root) {
            return false;
        }
        if (this.root.isDummy) {
            return this.root.permission === Access.RW;
        }
        if (!this.store.root.userStore.current) {
            return this.root.permission === Access.RW;
        }
        const userId = this.store.root.userStore.current.id;
        if (this.authorId === userId) {
            return this.root.permission === Access.RW;
        }
        return this.root.sharedAccess === Access.RW && this.root.permission === Access.RW;
    }

    @computed
    get canDisplay() {
        if (!this.root) {
            return true;
        }
        if (!this.store.root.userStore.current) {
            return this.root.permission !== Access.None;
        }
        const userId = this.store.root.userStore.current.id;
        if (this.root.permission === Access.None) {
            return false;
        }
        if (this.authorId === userId) {
            return true;
        }
        return this.root.sharedAccess !== Access.None;
    }

    @action
    cleanup() {
        /**
         * cancel pending actions and cleanup if needed...
         */
        this.stateDisposer();
    }

    @action
    saveNow() {
        this.save();
        return this.save.flush();
    }

    @action
    _save() {
        /**
         * call the api to save the code...
         */
        this.state = ApiState.SYNCING;
        return this.store.save(this).then(
            action((res) => {
                if (res === 'error') {
                    this.state = ApiState.ERROR;
                } else {
                    this.state = ApiState.SUCCESS;
                }
            })
        );
    }
}

export default iDocument;
