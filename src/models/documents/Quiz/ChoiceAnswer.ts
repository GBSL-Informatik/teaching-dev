import { TypeDataMapping, Document as DocumentProps, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import type { ReactElement } from 'react';
import iAssessable from './iAssessable';
import { createRandomOrderMap } from '@tdev-components/documents/ChoiceAnswer/helpers/shared';
import { range } from 'es-toolkit/math';
import { shuffle } from 'es-toolkit/array';
export interface MetaInit {
    readonly?: boolean;
    qid?: string;
    multiple?: boolean;
    randomizeOptions?: boolean;
    optionsCount: number;
}

export enum ChoiceAnswerCorrectness {
    Correct = 'correct',
    Incorrect = 'incorrect',
    PartiallyCorrect = 'partially_correct',
    NA = 'not_answered'
}

export interface ChoiceAnswerScoring {
    maxPoints: number;
    pointsAchieved: number;
    scoringHint?: string | (() => ReactElement);
}

export interface ChoiceAnswerAssessment {
    correctness: ChoiceAnswerCorrectness;
    scoring?: ChoiceAnswerScoring;
}

export class ModelMeta extends TypeMeta<'choice_answer'> {
    readonly type = 'choice_answer';
    readonly readonly?: boolean;
    readonly qid?: string;
    readonly multiple?: boolean;
    readonly randomizeOptions?: boolean;
    readonly optionsCount: number;

    constructor(props: Partial<MetaInit> & { optionsCount: number }) {
        super('choice_answer', props.readonly ? Access.RO_User : undefined);
        this.readonly = props.readonly;
        this.qid = props.qid;
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

class ChoiceAnswer extends iAssessable<'choice_answer'> {
    readonly qid?: string;
    choices = observable.set<number>();
    @observable.ref accessor optionOrders: number[];
    assessments = observable.map<number, ChoiceAnswerAssessment>();

    constructor(props: DocumentProps<'choice_answer'>, store: DocumentStore) {
        super(props, store);
        this.choices.replace(props.data.choices ?? []);
        this.optionOrders = props.data?.optionsOrder || [];
        this.assessments = observable.map<number, ChoiceAnswerAssessment>();
        this.qid = props.data.qid;
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
    resetAnswer(): void {
        this.choices.clear();
        this.assessments.clear();
        this.setAssessed(false);
        this.saveNow();
    }

    @action
    onLinkedMetaChange() {
        if (this.meta.randomizeOptions && this.optionOrders.length !== this.meta.optionsCount) {
            this.shuffle();
        }
    }

    @action
    shuffle(): void {
        if (this.meta.optionsCount < 2) {
            return;
        }
        const originalIndices = range(this.meta.optionsCount);
        this.optionOrders = shuffle(originalIndices);
        this.saveNow();
    }

    optionsDisplayOrder(optionIndex: number): number {
        const orderIndex = this.optionOrders.findIndex((i) => i === optionIndex);
        return orderIndex !== -1 ? orderIndex : optionIndex;
    }

    @action
    updateAssessment(questionIndex: number, assessment: ChoiceAnswerAssessment): void {
        this.assessments.set(questionIndex, assessment);
    }

    getAssessment(questionIndex: number): ChoiceAnswerAssessment | undefined {
        return this.assessments.get(questionIndex);
    }

    @computed
    get hasQuestionsWithScoring(): boolean {
        return Array.from(this.assessments.values()).some((assessment) => !!assessment.scoring);
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
