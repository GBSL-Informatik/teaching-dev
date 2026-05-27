import { Access, type TypeDataMapping, type AssessableType } from '@tdev-api/document';
import type { default as iAssessable, Assessement } from './iAssessable';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface AssessableComponentProps<T extends AssessableType> {
    id?: string;
    qid?: string;
    title?: string;
    correct?: number[];
    scoring?: ScoringFunction<T>;
    readonly?: boolean;
    children: React.ReactNode;
}

export type ScoringFunction<T extends AssessableType> = (model: iAssessable<T>) => Assessement;

export abstract class AssessableMeta<T extends AssessableType> extends TypeMeta<T> {
    readonly qid?: string;
    readonly correct?: number[];
    readonly scoring?: ScoringFunction<T>;
    constructor(type: T, props: Partial<AssessableComponentProps<T>>) {
        super(type, props.readonly ? Access.RO_User : undefined);
        this.qid = props.qid;
        this.correct = props.correct?.map((index) => index - 1); // convert to 0-based index
        this.scoring = props.scoring;
    }
    abstract get defaultData(): TypeDataMapping[T];
}
