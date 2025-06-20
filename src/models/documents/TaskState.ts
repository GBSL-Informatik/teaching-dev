import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    StateType,
    TypeDataMapping,
    Access
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import { mdiIcon } from '@tdev-components/documents/TaskState';
import { mdiColor } from '@tdev-components/EditingOverview';

export interface MetaInit {
    readonly?: boolean;
    states?: StateType[];
    pagePosition?: number;
}

export const DEFAULT_TASK_STATES: StateType[] = ['unset', 'checked', 'question'] as const;

export class TaskMeta extends TypeMeta<DocumentType.TaskState> {
    readonly type = DocumentType.TaskState;
    readonly readonly: boolean;
    readonly default: StateType;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.TaskState, props.readonly ? Access.RO_User : undefined, props.pagePosition);
        this.default = props.states && props.states.length > 0 ? props.states[0] : DEFAULT_TASK_STATES[0];
        this.readonly = !!props.readonly;
    }

    get defaultData(): TypeDataMapping[DocumentType.TaskState] {
        return {
            state: this.default
        };
    }
}

class TaskState extends iDocument<DocumentType.TaskState> {
    @observable accessor _taskState: StateType;
    @observable accessor scrollTo: boolean = false;
    constructor(props: DocumentProps<DocumentType.TaskState>, store: DocumentStore) {
        super(props, store);
        this._taskState = props.data?.state;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.TaskState], from: Source, updatedAt?: Date): void {
        if (!RWAccess.has(this.root?.permission)) {
            return;
        }
        this._taskState = data.state;

        if (from === Source.LOCAL) {
            this.saveNow();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.TaskState] {
        return {
            state: this._taskState
        };
    }

    @computed
    get taskState(): StateType {
        return this.derivedData.state;
    }

    @computed
    get isDone(): boolean {
        return this.taskState === 'checked';
    }

    @computed
    get editingIconState() {
        return {
            path: mdiIcon[this.taskState],
            color: `var(${mdiColor[this.taskState]})`
        };
    }

    @computed
    get meta(): TaskMeta {
        if (this.root?.type === DocumentType.TaskState) {
            return this.root.meta as TaskMeta;
        }
        return new TaskMeta({});
    }

    @action
    setScrollTo(scrollTo: boolean) {
        this.scrollTo = scrollTo;
    }

    @action
    setState(state: StateType) {
        this.setData(
            {
                state
            },
            Source.LOCAL,
            new Date()
        );
    }
}

export default TaskState;
