import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '../iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    StateType,
    TypeDataMapping,
    Access
} from '@site/src/api/document';
import DocumentStore from '@site/src/stores/DocumentStore';
import { TypeMeta } from '../DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    states?: StateType[];
}

export class TaskMeta extends TypeMeta<DocumentType.TaskState> {
    readonly type = DocumentType.TaskState;
    readonly readonly: boolean;
    readonly taskState: StateType[];

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.TaskState, props.readonly ? Access.RO : undefined);
        this.taskState =
            props.states && props.states.length > 0 ? props.states : ['unset', 'checked', 'question'];
        this.readonly = !!props.readonly;
    }

    get defaultData(): TypeDataMapping[DocumentType.TaskState] {
        return {
            state: this.taskState[0]
        };
    }
}

class TaskState extends iDocument<DocumentType.TaskState> {
    @observable accessor taskState: StateType;

    /**
     * used to sort the tasks in the task list
     */
    @observable accessor windowPositionY: number = -1;

    constructor(props: DocumentProps<DocumentType.TaskState>, store: DocumentStore) {
        super(props, store);
        this.taskState = props.data.state;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.TaskState], from: Source, updatedAt?: Date): void {
        if (this.root?.access !== Access.RW) {
            return;
        }
        this.taskState = data.state;

        if (from === Source.LOCAL) {
            this.saveNow();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.TaskState] {
        return {
            state: this.taskState
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
    nextState() {
        const idx = this.meta.taskState.indexOf(this.taskState);
        this.setData(
            {
                state: this.meta.taskState[(idx + 1) % this.meta.taskState.length]
            },
            Source.LOCAL,
            new Date()
        );
    }

    @action
    setWindowPositionY(y: number) {
        this.windowPositionY = y;
    }
}

export default TaskState;
