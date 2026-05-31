import { AssessableType, Document as DocumentProps } from '@tdev-api/document';
import iDocument from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import React from 'react';
import { AssessableMeta } from './AssessableMeta';
import Quiz from './Quiz';
import { iTaskableDocument } from '@tdev-models/iTaskableDocument';
import { mdiCheckCircleOutline, mdiTooltipQuestionOutline } from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';

export enum Correctness {
    Correct = 'correct',
    Incorrect = 'incorrect',
    PartiallyCorrect = 'partially_correct',
    NA = 'not_answered'
}

export interface Scoring {
    maxPoints: number;
    pointsAchieved: number;
    scoringHint?: string | (() => React.ReactElement);
}

export interface Assessement {
    correctness: Correctness;
    scoring?: Scoring;
}

export interface MetaInit {
    readonly?: boolean;
}

abstract class iAssessable<T extends AssessableType> extends iDocument<T> implements iTaskableDocument<T> {
    readonly qid?: string;
    @observable accessor scrollTo: boolean = false;
    @observable accessor _assessed: boolean;
    // @observable.ref accessor scoringFunction: ((self: this) => Assessement) | null = null;
    @observable.ref accessor linkedMeta: AssessableMeta<T> | null = null;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store, 50);
        this._assessed = props.data?.assessed || false;
        this.qid = props.data.qid;
    }

    @action
    setLinkedMeta(metadata: AssessableMeta<T>) {
        this.linkedMeta = metadata;
        this.onLinkedMetaChange();
    }

    onLinkedMetaChange() {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }

    @computed
    get isDone(): boolean {
        return this.isAssessed;
    }

    @computed
    get hideFromOverview() {
        return this.inQuiz;
    }

    @computed
    get editingIconState() {
        return { path: mdiTooltipQuestionOutline, color: this.isAssessed ? IfmColors.green : IfmColors.gray };
    }

    @computed
    get progress(): number {
        if (!this.isAssessed) {
            return 0;
        }
        return this.assessment?.scoring?.pointsAchieved || 0;
    }

    get totalSteps(): number {
        return 1;
    }

    @action
    setScrollTo(scroll: boolean) {
        this.scrollTo = scroll;
    }

    @computed
    get quiz(): Quiz | undefined {
        if (!this.inQuiz || this.root?.firstMainDocument?.type !== 'quiz') {
            return undefined;
        }
        if (this.root.firstMainDocument.id === this.id) {
            return undefined;
        }
        return this.root.firstMainDocument;
    }

    @computed
    get scoringFunction(): ((self: iAssessable<T>) => Assessement) | null {
        if (this.linkedMeta?.scoring) {
            return this.linkedMeta.scoring;
        }
        if (!this.inQuiz || this.type === 'quiz') {
            return null;
        }
        const quiz = this.root?.firstMainDocument;
        if (quiz?.type !== 'quiz') {
            return null;
        }
        return quiz.scoringFunction as ((self: iAssessable<T>) => Assessement) | null;
    }

    @computed
    get isAssessed(): boolean {
        if (this.type === 'quiz') {
            return this._assessed;
        }
        return this._assessed || !!this.quiz?.isAssessed;
    }

    @computed
    get isNA(): boolean {
        return this.hits === 0 && this.misses === 0;
    }

    @computed
    get assessment(): Assessement | undefined {
        return this.scoringFunction?.(this);
    }

    @action
    setAssessed(value: boolean) {
        this._assessed = value;
        this.saveNow();
    }

    @computed
    get scoring() {
        if (!this.isAssessed) {
            return;
        }
        return this.assessment?.scoring;
    }

    @computed
    get correctness(): Correctness {
        if (!this.isAssessed || this.isNA) {
            return Correctness.NA;
        }
        return this.hits === this.maxHits && this.misses === 0
            ? Correctness.Correct
            : this.hits === 0
              ? Correctness.Incorrect
              : Correctness.PartiallyCorrect;
    }

    /**
     * Returns the maximum achievable "hits" for this assessable item.
     */
    @computed
    get maxHits(): number {
        return this.linkedMeta?.correct?.length || 0;
    }

    /**
     * Returns the number of correctly responded items.
     * This can be "correct choices" for MC questions, "correct matched words" for texts or simply "1/0" for single-choice questions.
     */
    get hits(): number {
        return 0;
    }

    /**
     * Returns the number of incorrectly responded items.
     * This can be "incorrect choices" for MC questions, "wrong matched words" in a text or simply "0/1" for single-choice questions.
     */
    get misses(): number {
        return 0;
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this.isAssessed;
    }

    @computed
    get inQuiz() {
        return !!this.qid;
    }

    @computed
    get displayTitle() {
        if (!this.linkedMeta) {
            return 'Frage';
        }
        if (!this.inQuiz || !this.quiz) {
            return this.linkedMeta.title ?? 'Frage';
        }
        if (this.quiz.meta.hideQuestionNumbers && this.linkedMeta.title) {
            return this.linkedMeta.title;
        }
        const nr = this.quiz.questionDisplayOrder(this.linkedMeta.qid) + 1;
        return this.linkedMeta.title ? `Frage ${nr} – ${this.linkedMeta.title}` : `Frage ${nr}`;
    }

    abstract reset(): void;

    shuffle(): void {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }

    @computed
    get questionIndex(): number | undefined {
        if (!this.inQuiz || !this.quiz) {
            return undefined;
        }
        return this.quiz.questionDisplayOrder(this.linkedMeta?.qid);
    }
}

export default iAssessable;
