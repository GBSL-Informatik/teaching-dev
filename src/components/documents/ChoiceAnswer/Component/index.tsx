import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import ChoiceAnswerDocument, {
    ChoiceAnswerCorrectness,
    ModelMeta
} from '@tdev-models/documents/Quiz/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { QuizContext } from '../Quiz';
import Button from '@tdev-components/shared/Button';
import { mdiTrashCanOutline } from '@mdi/js';
import QuestionControls from '../Controls';
import { FeedbackBadge } from '../Feedback';
import { ScoringFunction } from '../helpers/scoring';
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useDummyId } from '@tdev-hooks/useDummyId';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import { DocumentModelType } from '@tdev-api/document';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import { useDocument } from '@tdev-hooks/useContextDocument';

interface SharedProps {
    id?: string;
    title?: string;
    correct?: number[];
    scoring?: ScoringFunction;
    questionIndex?: number;
    multiple?: boolean;
    randomizeOptions?: boolean;
    optionsCount: number;
    readonly?: boolean;
    children: React.ReactNode;
}
export interface StandaloneProps extends SharedProps {
    id: string;
    qid: never;
}

export interface InQuizProps extends SharedProps {
    qid: string;
}

export type ChoiceAnswerProps = StandaloneProps | InQuizProps;

interface ThinWrapperProps {
    children: React.ReactNode;
}

interface OptionProps {
    children: React.ReactNode;
    optionIndex: number;
}

type ChoiceAnswerSubComponents = {
    Before: React.FC<ThinWrapperProps>;
    Options: React.FC<ThinWrapperProps>;
    Option: React.FC<OptionProps>;
    After: React.FC<ThinWrapperProps>;
};

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRootId = useDocumentRootId(props.id);
    // when inside a quizz, this will share the document root with the quiz
    const documentRoot = useDocumentRoot(docRootId, meta);
    const selector = React.useCallback(
        (doc: DocumentModelType) => {
            if (props.qid) {
                return doc.type === meta.type && doc.data.qid === props.qid;
            }
            return doc.type === meta.type;
        },
        [meta.type, props.qid]
    );

    const doc = useFirstDocumentBy(docRootId, meta, selector);
    const isBrowser = useIsBrowser();

    // TODO: shuffle
    // React.useEffect(() => {
    //     if (randomizeOptions && !doc?.data.optionOrders?.[questionIndex]) {
    //         doc?.updateOptionOrders({
    //             ...doc.data.optionOrders,
    //             [questionIndex]: createRandomOrderMap(props.optionsCount)
    //         });
    //     }
    // }, [randomizeOptions, doc, questionIndex, props.optionsCount]);

    // TODO: assessment
    // React.useEffect(() => {
    //     if (!doc) {
    //         return;
    //     }

    //     if (props.correct === undefined) {
    //         // If no correct options are given, we assume that this question doesn't support assessment.
    //         return;
    //     }
    //     const correctOptions = new Set(props.correct);

    //     const scoringFunction = props.scoring ?? parentProps.scoring;
    //     const assessment = assess(
    //         doc,
    //         props.multiple ?? false,
    //         questionIndex,
    //         correctOptions,
    //         props.optionsCount,
    //         scoringFunction
    //     );
    //     doc.updateAssessment(questionIndex, assessment);
    // }, [doc, doc?.choices, doc?.isAssessed]);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

    // const assessment = doc.getAssessment(questionIndex);
    // const feedbackStyle = {
    //     [styles.correct]: doc.isAssessed && assessment?.correctness === ChoiceAnswerCorrectness.Correct,
    //     [styles.partiallyCorrect]:
    //         doc.isAssessed && assessment?.correctness === ChoiceAnswerCorrectness.PartiallyCorrect,
    //     [styles.incorrect]: doc.isAssessed && assessment?.correctness === ChoiceAnswerCorrectness.Incorrect
    // };

    const childrenArray = React.Children.toArray(props.children);
    const beforeBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.Before
    );
    const optionsBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.Options
    );
    const afterBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.After
    );

    // const onOptionChange = (optionIndex: number, checked: boolean) => {
    //     parentProps.setFocussedQuestion?.(questionIndex);
    //     if (props.multiple) {
    //         doc?.updateMultipleChoiceSelection(questionIndex, optionIndex, checked);
    //     } else {
    //         checked
    //             ? doc?.updateSingleChoiceSelection(questionIndex, optionIndex)
    //             : doc?.resetAnswer(questionIndex);
    //     }
    // };

    // const questionOrder =
    //     parentProps.randomizeQuestions && parentProps.questionOrder
    //         ? parentProps.questionOrder[questionIndex]
    //         : questionIndex;

    // const questionNumberToDisplay =
    //     (parentProps.randomizeQuestions
    //         ? (parentProps.questionOrder?.[questionIndex] ?? questionIndex)
    //         : questionIndex) + 1;
    // const canonicalTitle =
    //     props.inQuiz && !parentProps.hideQuestionNumbers
    //         ? props.title
    //             ? `Frage ${questionNumberToDisplay} – ${props.title}`
    //             : `Frage ${questionNumberToDisplay}`
    //         : props.title;
    const canonicalTitle = undefined;
    const displayTitle = canonicalTitle || 'Frage';

    return (
        <div
            className={clsx('card', styles.choiceAnswerContainer /*feedbackStyle*/)}
            // style={{ order: questionOrder }}
            // tabIndex={questionOrder}
        >
            <div className={clsx('card__header', styles.header /*feedbackStyle*/)}>
                <span className={clsx(styles.title)}>{displayTitle}</span>
                <div className={clsx(styles.controlsAndFeedback)}>
                    {/* {!!props.correct && (
                        <QuestionControls
                            doc={doc}
                            questionIndex={questionIndex}
                            focussedQuestion={parentProps.focussedQuestion === questionIndex}
                            inQuiz={!!props.qid}
                        />
                    )} */}
                    {/* <FeedbackBadge doc={doc} questionIndex={questionIndex} /> */}
                </div>
            </div>

            <div className={clsx('card__body')}>
                {beforeBlock}
                <DocContext.Provider value={doc}>
                    <div className={styles.optionsBlock}>{optionsBlock}</div>
                </DocContext.Provider>
                {/* <ChoiceAnswerContext.Provider
                    value={{
                        doc: doc,
                        questionIndex: questionIndex,
                        multiple: props.multiple,
                        randomizeOptions: randomizeOptions,
                        onChange: onOptionChange
                    }}
                > */}
                {/* </ChoiceAnswerContext.Provider> */}
                {afterBlock}
            </div>
        </div>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Option = observer(({ optionIndex, children }: OptionProps) => {
    const doc = useDocument<'choice_answer'>();
    // const { doc, questionIndex, multiple, randomizeOptions, onChange } =
    //     React.useContext(ChoiceAnswerContext);

    const optionId = React.useId();

    const isChecked = doc.choices.has(optionIndex);

    // const optionOrder =
    //     randomizeOptions && doc?.optionOrders[questionIndex] !== undefined
    //         ? doc.optionOrders[questionIndex][optionIndex]
    //         : optionIndex;

    return (
        <div
            key={optionId}
            className={clsx(styles.choiceAnswerOptionContainer)}
            style={
                {
                    // order: optionOrder
                }
            }
        >
            <div className={styles.checkboxContainer}>
                <input
                    type={doc.multiple ? 'checkbox' : 'radio'}
                    id={optionId}
                    name={doc.multiple ? optionId : `${doc?.id}-q${doc.qid}`}
                    value={optionId}
                    onChange={(e) => doc.updateSelection(optionIndex, e.target.checked, doc.multiple)}
                    checked={isChecked}
                    className={styles.checkbox}
                    disabled={!doc?.canUpdateAnswer}
                    // tabIndex={optionOrder}
                />
            </div>
            <label htmlFor={optionId}>{children}</label>
            {/* {!multiple && (
                <div className={styles.btnDeleteAnswerContainer}>
                    <Button
                        color="danger"
                        icon={mdiTrashCanOutline}
                        iconSide="left"
                        size={0.7}
                        onClick={() => onChange(optionIndex, false)}
                        className={clsx(styles.btnDeleteAnswer, {
                            [styles.visible]: doc?.canUpdateAnswer && isChecked
                        })}
                    />
                </div>
            )} */}
        </div>
    );
});

ChoiceAnswer.Before = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.Options = ({ children }: { children: React.ReactNode }) => {
    return <div className={clsx(styles.optionsContainer)}>{children}</div>;
};
ChoiceAnswer.After = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default ChoiceAnswer;
