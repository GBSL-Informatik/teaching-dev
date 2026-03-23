import { TypeDataMapping, Document as DocumentProps, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import type { ReactElement } from 'react';

export interface ChoiceAnswerChoices {
    [questionIndex: number]: number[];
}

export interface ChoiceAnswerOptionOrders {
    [questionIndex: number]: {
        [originalOptionIndex: number]: number;
    };
}

export type ChoiceAnswerQuestionOrder = { [originalQuestionIndex: number]: number };

export interface MetaInit {
    readonly?: boolean;
}

export enum ChoiceAnswerResult {
    Correct = 'correct',
    Incorrect = 'incorrect',
    PartiallyCorrect = 'partially_correct',
    NA = 'not_answered'
}

export interface ChoiceAnswerPoints {
    maxPoints: number;
    pointsAchieved: number;
    gradingHint?: string | (() => ReactElement);
}

export interface ChoiceAnswerGrading {
    result: ChoiceAnswerResult;
    points?: ChoiceAnswerPoints;
}

export class ModelMeta extends TypeMeta<'choice_answer'> {
    readonly type = 'choice_answer';
    readonly readonly?: boolean;

    constructor(props: Partial<MetaInit>) {
        super('choice_answer', props.readonly ? Access.RO_User : undefined);
        this.readonly = props.readonly;
    }

    get defaultData(): TypeDataMapping['choice_answer'] {
        return {
            choices: {},
            optionOrders: {},
            questionOrder: null,
            graded: false
        };
    }
}

class ChoiceAnswer extends iDocument<'choice_answer'> {
    @observable.ref accessor choices: ChoiceAnswerChoices;
    @observable.ref accessor optionOrders: ChoiceAnswerOptionOrders;
    @observable.ref accessor questionOrder: ChoiceAnswerQuestionOrder | null;
    gradings = observable.map<number, ChoiceAnswerGrading>();
    @observable accessor _graded: boolean;

    constructor(props: DocumentProps<'choice_answer'>, store: DocumentStore) {
        super(props, store);
        this.choices = props.data?.choices || {};
        this.optionOrders = props.data?.optionOrders || {};
        this.questionOrder = props.data?.questionOrder || null;
        this._graded = props.data?.graded || false;
        this.gradings = observable.map<number, ChoiceAnswerGrading>();
    }

    @action
    setData(data: TypeDataMapping['choice_answer'], from: Source, updatedAt?: Date): void {
        this.choices = data.choices;
        this.optionOrders = data.optionOrders;
        this.questionOrder = data.questionOrder;
        this._graded = data.graded;

        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this._graded;
    }

    @action
    updateSingleChoiceSelection(questionIndex: number, optionIndex: number): void {
        if (!this.canUpdateAnswer) {
            return;
        }

        this.updatedAt = new Date();
        this.choices = {
            ...this.choices,
            [questionIndex]: [optionIndex]
        };
        this.save();
    }

    @action
    updateMultipleChoiceSelection(questionIndex: number, optionIndex: number, selected: boolean): void {
        if (!this.canUpdateAnswer) {
            return;
        }

        this.updatedAt = new Date();
        const currentSelections = new Set<number>(this.choices[questionIndex] as number[] | []);
        if (selected) {
            currentSelections.add(optionIndex);
        } else {
            currentSelections.delete(optionIndex);
        }
        this.choices = {
            ...this.choices,
            [questionIndex]: Array.from(currentSelections)
        };
        this.save();
    }

    @action
    resetAllAnswers(): void {
        if (!this.canUpdateAnswer) {
            return;
        }

        this.updatedAt = new Date();
        this.choices = {};
        this.save();
    }

    @action
    resetAnswer(questionIndex: number): void {
        if (!this.canUpdateAnswer) {
            return;
        }

        this.updatedAt = new Date();
        this.choices = {
            ...this.choices,
            [questionIndex]: []
        };
        this.save();
    }

    @action
    updateOptionOrders(optionOrders: ChoiceAnswerOptionOrders): void {
        this.updatedAt = new Date();
        this.optionOrders = optionOrders;
        this.saveNow();
    }

    @action
    updateQuestionOrder(questionOrder: ChoiceAnswerQuestionOrder): void {
        this.updatedAt = new Date();
        this.questionOrder = questionOrder;
        this.saveNow();
    }

    get graded() {
        return this._graded;
    }

    @action
    set graded(value: boolean) {
        this.updatedAt = new Date();
        this._graded = value;
        this.saveNow();
    }

    @action
    updateGrading(questionIndex: number, grading: ChoiceAnswerGrading): void {
        this.gradings.set(questionIndex, grading);
    }

    getGrading(questionIndex: number): ChoiceAnswerGrading | undefined {
        return this.gradings.get(questionIndex);
    }

    get data(): TypeDataMapping['choice_answer'] {
        return {
            choices: this.choices,
            optionOrders: this.optionOrders,
            questionOrder: this.questionOrder,
            graded: this._graded
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'choice_answer') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default ChoiceAnswer;
