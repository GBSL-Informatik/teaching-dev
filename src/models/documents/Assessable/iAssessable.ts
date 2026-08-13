import { AssessableType, Document as DocumentProps } from '@tdev-api/document';
import iDocument from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable, observableRef } from 'mobx';
import React from 'react';
import { AssessableMeta, ExpandedOption } from './AssessableMeta';
import Quiz from './Quiz';
import { iTaskableDocument } from '@tdev-models/iTaskableDocument';
import { mdiTooltipQuestionOutline } from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';

export enum Correctness {
    Correct = 'correct',
    Incorrect = 'incorrect',
    PartiallyCorrect = 'partially_correct',
    NA = 'not_answered'
}

export const CorrectnessColors: Record<Correctness, string> = {
    [Correctness.Correct]: IfmColors.green,
    [Correctness.Incorrect]: IfmColors.red,
    [Correctness.PartiallyCorrect]: IfmColors.orange,
    [Correctness.NA]: IfmColors.lightBlue
};

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
    // @observableRef accessor scoringFunction: ((self: this) => Assessement) | null = null;
    @observableRef accessor linkedMeta: AssessableMeta<T> | null = null;
    @observable accessor showAllOptions: boolean = false;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store, 50);
        this._assessed = props.data?.assessed || false;
        this.qid = props.data.qid;
        this._checkIntegrity();
    }

    @action
    setLinkedMeta(metadata: AssessableMeta<T>) {
        this.linkedMeta = metadata;
        this.onLinkedMetaChange();
    }

    onLinkedMetaChange() {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }

    @action
    setShowAllOptions(value: boolean) {
        this.showAllOptions = value;
    }

    /**
     * returns wheter the
     *  - the answer is correct
     *  - the question is answered
     *  - linked meta allows collapsing
     */
    @computed
    get canCollapseOptions(): boolean {
        if (!this.linkedMeta) {
            return false;
        }
        if (!this.isAssessed || this.correctness !== Correctness.Correct) {
            return false;
        }
        const opts = [this.linkedMeta.keepExpanded, this.quiz?.linkedMeta?.keepExpanded].filter((v) => !!v);
        return opts.some((o) => o !== 'all');
    }

    @computed
    get keepExpanded(): ExpandedOption {
        if (this.showAllOptions || !this.canCollapseOptions) {
            return 'all';
        }
        return this.linkedMeta?.keepExpanded ?? this.quiz?.linkedMeta?.keepExpanded ?? 'all';
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
        return {
            path: mdiTooltipQuestionOutline,
            color: this.isAssessed ? CorrectnessColors[this.correctness] : IfmColors.gray
        };
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
        if (this.type === 'quiz' || !this.inQuiz) {
            return undefined;
        }
        const quiz = this.root?.documents.find(
            (doc) => doc.authorId === this.authorId && doc.type === 'quiz'
        );
        return quiz as Quiz | undefined;
    }

    @computed
    get scoringFunction(): ((self: iAssessable<T>) => Assessement) | null {
        if (this.linkedMeta?.scoring) {
            return this.linkedMeta.scoring;
        }
        if (!this.inQuiz || !this.quiz) {
            return null;
        }
        return this.quiz.scoringFunction as ((self: iAssessable<T>) => Assessement) | null;
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
        if (this.assessment) {
            return this.assessment.correctness;
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
    get maxHits(): number {
        return this._meta?.correct?.length || 0;
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

    @computed
    get _meta(): AssessableMeta<T> | undefined {
        if (this.linkedMeta) {
            return this.linkedMeta as AssessableMeta<T>;
        }
        if (this.root?.type === this.type) {
            return this.root.meta as AssessableMeta<T>;
        }
    }

    @action
    _checkIntegrity() {
        const user = this.store.root.userStore.current;
        if (user && this.authorId !== user.id) {
            return;
        }
        if (this.inQuiz && this.quiz) {
            // ensure the current document is unique for the given qid and authorId
            if (!this.quiz.questionIds.has(this.qid!)) {
                this._destroy();
            } else {
                // check for duplicates
                const duplicates = this.quiz.questions.filter(
                    (q) => q.qid === this.qid && q.authorId === this.authorId
                );
                if (duplicates.length > 1) {
                    // only keep the oldest one, delete the rest
                    const sorted = duplicates.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                    const toDelete = sorted.slice(1);
                    toDelete.forEach((doc) => {
                        doc._destroy();
                    });
                }
            }
        }
    }

    @action
    _destroy() {
        const user = this.store.root.userStore.current;
        if (user && this.authorId !== user?.id) {
            return;
        }
        // for now, only allow deletion of nested docs
        if (!this.inQuiz) {
            return;
        }
        if (user) {
            this.store.apiDelete(this);
        } else {
            this.store.removeFromStore(this);
        }
    }
}

export default iAssessable;
