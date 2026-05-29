import { TypeDataMapping, Document as DocumentProps, AssessableType } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import iAssessable from './iAssessable';
import { range } from 'es-toolkit/math';
import { shuffle } from 'es-toolkit/array';
import type { Props as QuizProps } from '@tdev-components/documents/Assessable/Quiz';
import { AssessableMeta } from './AssessableMeta';

export class ModelMeta extends AssessableMeta<'quiz'> {
    readonly type = 'quiz';
    readonly randomizeOptions?: boolean;
    readonly randomizeQuestions?: boolean;
    readonly minPoints?: number;
    readonly questionIds: string[];

    constructor(props: Partial<QuizProps>) {
        super('quiz', props);
        this.randomizeOptions = props.randomizeOptions;
        this.randomizeQuestions = props.randomizeQuestions;
        this.questionIds = props.questionIds ?? [];
        this.minPoints = props.minPoints;
    }

    get defaultData(): TypeDataMapping['quiz'] {
        const data: TypeDataMapping['quiz'] = {
            questionOrder: [],
            assessed: false
        };
        return data;
    }
}

const DEFAULT_META = new ModelMeta({});

class Quiz extends iAssessable<'quiz'> {
    @observable.ref accessor questionOrder: number[];

    constructor(props: DocumentProps<'quiz'>, store: DocumentStore) {
        super(props, store);
        this.questionOrder = props.data.questionOrder || [];
    }

    @action
    setData(data: Partial<TypeDataMapping['quiz']>, from: Source, updatedAt?: Date): void {
        if (data.questionOrder) {
            this.questionOrder = data.questionOrder;
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
    reset(): void {
        this.questionOrder = [];
        this.setAssessed(false);
        this.saveNow();
    }

    @computed
    get questionCount(): number {
        return this.meta.questionIds.length;
    }

    @action
    onLinkedMetaChange() {
        if (this.meta.randomizeQuestions && this.questionOrder.length !== this.questionCount) {
            this.shuffle();
            this.saveNow();
        }
    }

    @action
    shuffle(): void {
        if (this.questionCount === 0) {
            return;
        }
        const originalIndices = range(this.questionCount);
        this.questionOrder = shuffle(originalIndices);
    }

    questionDisplayOrder(questionIndex: number): number {
        const orderIndex = this.questionOrder.findIndex((i) => i === questionIndex);
        return orderIndex !== -1 ? orderIndex : questionIndex;
    }

    @computed
    get questions(): iAssessable<AssessableType>[] {
        const docs = this.root?.documents ?? [];
        const qids = new Set(this.meta.questionIds);
        return docs.filter(
            (doc) =>
                (doc as iAssessable<AssessableType>).qid &&
                qids.has((doc as iAssessable<AssessableType>).qid!)
        ) as iAssessable<AssessableType>[];
    }

    @computed
    get achievements(): number {
        return this.questions.reduce((sum, q) => sum + (q.achievements ?? 0), 0);
    }

    @computed
    get mistakes(): number {
        return this.questions.reduce((sum, q) => sum + (q.mistakes ?? 0), 0);
    }

    get data(): TypeDataMapping['quiz'] {
        const raw: TypeDataMapping['quiz'] = {
            questionOrder: this.questionOrder,
            assessed: this._assessed
        };
        return raw;
    }

    @computed
    get meta(): ModelMeta {
        if (this.linkedMeta) {
            return this.linkedMeta as ModelMeta;
        }
        if (this.root?.type === 'quiz') {
            return this.root.meta as ModelMeta;
        }
        return DEFAULT_META;
    }
}

export default Quiz;
