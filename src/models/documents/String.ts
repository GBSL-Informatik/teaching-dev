import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    solution?: string;
    default?: string;
    sanitizer?: (val: string) => string;
    checker?: (val: string | undefined) => boolean;
}

export class ModelMeta extends TypeMeta<'string'> {
    readonly type = 'string';
    readonly readonly?: boolean;
    readonly solution?: string;
    readonly sanitizedSolution?: string;
    readonly default?: string;
    readonly sanitizer: (val: string) => string;
    readonly checker: (val: string | undefined) => boolean;

    constructor(props: Partial<MetaInit>) {
        super('string', props.readonly ? Access.RO_User : undefined);
        this.readonly = props.readonly;
        this.default = props.default;
        this.solution = props.solution;
        this.sanitizer =
            props.sanitizer && typeof props.sanitizer === 'function' ? props.sanitizer : (val: string) => val;
        this.sanitizedSolution = this.solution ? this.sanitizer(this.solution) : undefined;
        this.checker = props.checker || ((val: string | undefined) => val === this.sanitizedSolution);
    }

    get defaultData(): TypeDataMapping['string'] {
        return {
            text: this.default || ''
        };
    }
}

export enum StringAnswer {
    Unchecked = 'unchecked',
    Correct = 'correct',
    Wrong = 'wrong'
}

class String extends iDocument<'string'> {
    @observable accessor text: string;
    @observable accessor answer: StringAnswer = StringAnswer.Unchecked;
    constructor(props: DocumentProps<'string'>, store: DocumentStore) {
        super(props, store);
        this.text = props.data?.text || '';
    }

    @action
    setData(data: TypeDataMapping['string'], from: Source, updatedAt?: Date): void {
        this.text = data.text;
        this.answer = StringAnswer.Unchecked;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['string'] {
        return {
            text: this.text
        };
    }

    @computed
    get hasSolution() {
        return this.meta.solution !== undefined;
    }

    @action
    checkAnswer() {
        if (!this.hasSolution) {
            return;
        }
        if (this.text === this.meta.defaultData.text) {
            this.answer = StringAnswer.Unchecked;
        } else if (this.meta.checker(this.meta.sanitizer(this.text))) {
            this.answer = StringAnswer.Correct;
        } else {
            this.answer = StringAnswer.Wrong;
        }
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'string') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default String;
