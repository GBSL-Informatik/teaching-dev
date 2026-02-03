import { TypeDataMapping, Document as DocumentProps, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';

export interface ChoiceAnswerChoices {
    [questionIndex: number]: number[];
}

export interface ChoiceAnswerOrders {
    [questionIndex: number]: {
        index: number;
        optionsOrder: {
            [originalOptionIndex: number]: number;
        };
    };
}

export interface MetaInit {
    readonly?: boolean;
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
            orders: {}
        };
    }
}

class ChoiceAnswer extends iDocument<'choice_answer'> {
    @observable.ref accessor choices: ChoiceAnswerChoices;
    @observable.ref accessor orders: ChoiceAnswerOrders;

    constructor(props: DocumentProps<'choice_answer'>, store: DocumentStore) {
        super(props, store);
        this.choices = props.data?.choices || {};
        this.orders = props.data?.orders || {};
    }

    @action
    setData(data: TypeDataMapping['choice_answer'], from: Source, updatedAt?: Date): void {
        this.choices = data.choices;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    updateSingleChoiceSelection(questionIndex: number, optionIndex: number): void {
        this.updatedAt = new Date();
        this.choices = {
            ...this.choices,
            [questionIndex]: [optionIndex]
        };
        this.save();
    }

    @action
    updateMultipleChoiceSelection(questionIndex: number, optionIndex: number, selected: boolean): void {
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
    resetAnswer(questionIndex: number): void {
        this.updatedAt = new Date();
        this.choices = {
            ...this.choices,
            [questionIndex]: []
        };
        this.save();
    }

    @action
    updateOrders(orders: ChoiceAnswerOrders): void {
        this.updatedAt = new Date();
        this.orders = orders;
        this.saveNow();
    }

    get data(): TypeDataMapping['choice_answer'] {
        return {
            choices: this.choices,
            orders: this.orders
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
