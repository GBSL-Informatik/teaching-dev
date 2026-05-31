import { TypeDataMapping, Document as DocumentProps } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import iAssessable from './iAssessable';
import { range } from 'es-toolkit/math';
import { shuffle } from 'es-toolkit/array';
import type { ChoiceAnswerProps } from '@tdev-components/documents/Assessable/ChoiceAnswer';
import { AssessableMeta } from './AssessableMeta';

export class ModelMeta extends AssessableMeta<'choice_answer'> implements AssessableMeta<'choice_answer'> {
    readonly type = 'choice_answer';
    readonly readonly?: boolean;
    readonly optionsCount: number;
    readonly multiple?: boolean;
    readonly randomizeOptions?: boolean;

    constructor(props: Partial<ChoiceAnswerProps> & { optionsCount: number }) {
        super('choice_answer', props);
        this.multiple = props.multiple;
        this.randomizeOptions = props.randomizeOptions;
        this.optionsCount = props.optionsCount;
    }

    get defaultData(): TypeDataMapping['choice_answer'] {
        const data: TypeDataMapping['choice_answer'] = {
            choices: [],
            optionsOrder: [],
            assessed: false
        };
        if (this.qid) {
            data.qid = this.qid;
        }
        return data;
    }
}

const DEFAULT_META = new ModelMeta({ optionsCount: 0 });

class ChoiceAnswer extends iAssessable<'choice_answer'> implements iAssessable<'choice_answer'> {
    choices = observable.set<number>();
    @observable.ref accessor optionOrders: number[];
    // assessments = observable.map<number, ChoiceAnswerAssessment>();

    constructor(props: DocumentProps<'choice_answer'>, store: DocumentStore) {
        super(props, store);
        this.choices.replace(props.data.choices ?? []);
        this.optionOrders = props.data?.optionsOrder || [];
        // this.assessments = observable.map<number, ChoiceAnswerAssessment>();
    }

    @action
    setData(data: Partial<TypeDataMapping['choice_answer']>, from: Source, updatedAt?: Date): void {
        if (data.choices) {
            this.choices.replace(data.choices);
        }
        if (data.optionsOrder) {
            this.optionOrders = data.optionsOrder;
        }
        if (data.assessed !== undefined) {
            this._assessed = data.assessed;
        }

        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    updateSelection(optionIndex: number, selected: boolean = true, multiple: boolean = false): void {
        if (!this.canUpdateAnswer) {
            return;
        }
        if (multiple) {
            if (selected) {
                this.choices.add(optionIndex);
            } else {
                this.choices.delete(optionIndex);
            }
        } else {
            if (selected) {
                this.choices.replace([optionIndex]);
            } else {
                this.choices.clear();
            }
        }
        this.save();
    }

    @action
    reset(): void {
        this.choices.clear();
        this.setAssessed(false);
        this.saveNow();
    }

    @action
    onLinkedMetaChange() {
        const randomize = this.meta.randomizeOptions || this.quiz?.meta.randomizeOptions;
        if (randomize && this.optionOrders.length !== this.meta.optionsCount) {
            this.shuffle();
            this.saveNow();
        }
    }

    @action
    shuffle(): void {
        if (!this.meta.optionsCount || this.meta.optionsCount < 2) {
            return;
        }
        const originalIndices = range(this.meta.optionsCount);
        this.optionOrders = shuffle(originalIndices);
    }

    get maxPoints(): number {
        if (this.multiple) {
            return this.linkedMeta?.correct?.length || 0;
        }
        return !!this.linkedMeta?.correct ? 1 : 0;
    }

    optionsDisplayOrder(optionIndex: number): number {
        const orderIndex = this.optionOrders.findIndex((i) => i === optionIndex);
        return orderIndex !== -1 ? orderIndex : optionIndex;
    }

    @computed
    get achievements(): number {
        const correct = new Set(this.meta.correct);
        return this.choices.intersection(correct).size;
    }

    @computed
    get mistakes(): number {
        if (this.choices.size === 0) {
            return 0;
        }
        if (this.multiple) {
            const missedCorrect = (this.meta.correct ?? []).length - this.achievements;
            const incorrectSelections = this.choices.size - this.achievements;
            return missedCorrect + incorrectSelections;
        }
        return 1 - this.achievements;
    }

    @computed
    get multiple(): boolean {
        return this.meta?.multiple ?? false;
    }

    get data(): TypeDataMapping['choice_answer'] {
        const raw: TypeDataMapping['choice_answer'] = {
            choices: [...this.choices],
            optionsOrder: this.optionOrders,
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
        if (this.root?.type === 'choice_answer') {
            return this.root.meta as ModelMeta;
        }
        return DEFAULT_META;
    }
}

export default ChoiceAnswer;
