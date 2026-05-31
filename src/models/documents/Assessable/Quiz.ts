import { TypeDataMapping, Document as DocumentProps, AssessableType } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import iAssessable, { Assessement, Correctness } from './iAssessable';
import { range } from 'es-toolkit/math';
import { shuffle } from 'es-toolkit/array';
import type { Props as QuizProps } from '@tdev-components/documents/Assessable/Quiz';
import { AssessableMeta } from './AssessableMeta';
import { mdiTimelineQuestionOutline } from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';

export class ModelMeta extends AssessableMeta<AssessableType> implements AssessableMeta<AssessableType> {
    readonly type = 'quiz';
    readonly randomizeOptions?: boolean;
    readonly randomizeQuestions?: boolean;
    readonly minPoints?: number;
    readonly questionIds: string[];
    readonly hideQuestionNumbers?: boolean;

    constructor(props: Partial<QuizProps>) {
        super('quiz', props);
        this.randomizeOptions = props.randomizeOptions;
        this.randomizeQuestions = props.randomizeQuestions;
        this.questionIds = props.questionIds ?? [];
        this.minPoints = props.minPoints;
        this.hideQuestionNumbers = props.hideQuestionNumbers;
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

class Quiz extends iAssessable<AssessableType> implements iAssessable<AssessableType> {
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
        this.setAssessed(false);
        this.questions.forEach((q) => q.reset());
        this.saveNow();
    }

    @computed
    get questionCount(): number {
        return this.meta.questionIds.length;
    }

    @computed
    get scoringFunction(): ((self: iAssessable<AssessableType>) => Assessement) | null {
        return this.meta.scoring ?? null;
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

    questionDisplayOrder(qid?: string): number {
        if (!qid) {
            return 0;
        }
        const idx = this.meta.questionIds.findIndex((id) => id === qid);
        if (idx === -1) {
            return 0;
        }
        const orderIndex = this.questionOrder.findIndex((i) => i === idx);
        return orderIndex !== -1 ? orderIndex : idx;
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
    get assessment(): Assessement | undefined {
        const correctness: Correctness[] = [];
        const assessment = this.questions.reduce(
            (summary, q) => {
                if (!q.assessment) {
                    return summary;
                }
                correctness.push(q.correctness);
                if (q.assessment?.scoring) {
                    summary.scoring!.pointsAchieved += q.assessment.scoring.pointsAchieved;
                    summary.scoring!.maxPoints += q.assessment.scoring.maxPoints;
                }

                return summary;
            },
            { correctness: Correctness.NA, scoring: { pointsAchieved: 0, maxPoints: 0 } } as Assessement
        );
        const isAllNA = correctness.every((c) => c === Correctness.NA);
        const isAllCorrect = !isAllNA && correctness.every((c) => c === Correctness.Correct);
        const isAllIncorrect =
            !isAllNA && !isAllCorrect && correctness.every((c) => c === Correctness.Incorrect);
        const totalCorrectness = isAllNA
            ? Correctness.NA
            : isAllCorrect
              ? Correctness.Correct
              : isAllIncorrect
                ? Correctness.Incorrect
                : Correctness.PartiallyCorrect;
        if (assessment.scoring?.maxPoints === 0) {
            return { correctness: totalCorrectness };
        }
        if (this.meta.minPoints && assessment.scoring) {
            if (assessment.scoring.pointsAchieved < this.meta.minPoints) {
                assessment.scoring.pointsAchieved = this.meta.minPoints;
            }
            if (assessment.scoring.pointsAchieved > assessment.scoring.maxPoints) {
                assessment.scoring.pointsAchieved = assessment.scoring.maxPoints;
            }
        }
        return { ...assessment, correctness: totalCorrectness };
    }

    @computed
    get naCount(): number {
        return this.questions.reduce((sum, q) => sum + (q.isNA ? 1 : 0), 0);
    }

    @computed
    get hasNA(): boolean {
        return this.naCount > 0;
    }

    @computed
    get maxHits(): number {
        return this.questions.reduce((sum, q) => sum + q.maxHits, 0);
    }

    @computed
    get hits(): number {
        return this.questions.reduce((sum, q) => sum + (q.hits ?? 0), 0);
    }

    @computed
    get misses(): number {
        return this.questions.reduce((sum, q) => sum + (q.misses ?? 0), 0);
    }

    get data(): TypeDataMapping['quiz'] {
        const raw: TypeDataMapping['quiz'] = {
            questionOrder: this.questionOrder,
            assessed: this._assessed
        };
        return raw;
    }

    get editingIconState() {
        return {
            path: mdiTimelineQuestionOutline,
            color: !this.isAssessed
                ? IfmColors.gray
                : this.assessment?.correctness === Correctness.Correct
                  ? IfmColors.green
                  : IfmColors.orange
        };
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
