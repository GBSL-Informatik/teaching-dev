import { TypeDataMapping, Document as DocumentProps } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import iAssessable from './iAssessable';
import type { Props as TrueFalseProps } from '@tdev-components/documents/Assessable/TrueFalseAnswer';
import { AssessableMeta } from './AssessableMeta';

export class ModelMeta extends AssessableMeta<'true_false_answer'> {
    readonly type = 'true_false_answer';
    readonly readonly?: boolean;

    constructor(props: Partial<TrueFalseProps>) {
        const isTruthy = (props.isTrue ?? props.correct) === true;
        const isFalsey = (props.isFalse ?? props.incorrect) === true;
        const correct = isTruthy ? [1] : isFalsey ? [2] : [2];
        console.log('Initializing TrueFalseAnswerMeta with correct:', correct);
        super('true_false_answer', { ...props, correct });
        if (isTruthy && isFalsey) {
            console.warn('TrueFalseAnswer cannot be both truthy and falsey. Defaulting to truthy.');
        }
    }

    get defaultData(): TypeDataMapping['true_false_answer'] {
        const data: TypeDataMapping['true_false_answer'] = {
            value: null,
            assessed: false
        };
        if (this.qid) {
            data.qid = this.qid;
        }
        return data;
    }
}

const DEFAULT_META = new ModelMeta({});

class TrueFalseAnswer extends iAssessable<'true_false_answer'> {
    @observable accessor value: boolean | null = null;
    constructor(props: DocumentProps<'true_false_answer'>, store: DocumentStore) {
        super(props, store);
        this.value = props.data.value ?? null;
    }

    @action
    setData(data: Partial<TypeDataMapping['true_false_answer']>, from: Source, updatedAt?: Date): void {
        if (data.value !== undefined) {
            this.value = data.value;
        }
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    setValue(value: boolean | null): void {
        if (!this.canUpdateAnswer) {
            return;
        }
        this.value = value;
        this.saveNow();
    }

    @action
    resetAnswer(): void {
        this.value = null;
        this.setAssessed(false);
        this.saveNow();
    }

    @computed
    get achievements(): number {
        if (this.value === null) {
            return 0;
        }
        const correct = new Set(this.meta.correct);
        if (this.value) {
            return correct.has(0) ? 1 : 0;
        }
        return correct.has(1) ? 1 : 0;
    }

    @computed
    get mistakes(): number {
        if (this.value === null) {
            return 0;
        }
        return 1 - this.achievements;
    }

    get data(): TypeDataMapping['true_false_answer'] {
        const raw: TypeDataMapping['true_false_answer'] = {
            value: this.value,
            assessed: this._assessed
        };
        if (this.qid) {
            raw.qid = this.qid;
        }
        return raw;
    }

    @computed
    get meta(): ModelMeta {
        if (this.linkedMeta) {
            return this.linkedMeta as ModelMeta;
        }
        if (this.root?.type === 'true_false_answer') {
            return this.root.meta as ModelMeta;
        }
        return DEFAULT_META;
    }
}

export default TrueFalseAnswer;
