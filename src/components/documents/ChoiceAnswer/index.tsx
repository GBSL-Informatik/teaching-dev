import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import ChoiceAnswerDocument, { ChoiceAnswerResult, ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { QuizContext } from './Quiz';
import Button from '@tdev-components/shared/Button';
import { mdiTrashCanOutline } from '@mdi/js';
import _ from 'es-toolkit/compat';
import { createRandomOrderMap } from './helpers';
import QuestionControls from './Controls';
import { FeedbackAdmonition, FeedbackBadge } from './Feedback';
import { GradingFunction, updateGrading as grade } from './grading';
import { QuestionGradingHint } from './Hints';

export interface ChoiceAnswerProps {
    id: string;
    title?: string;
    correct?: number[];
    grading?: GradingFunction;
    questionIndex?: number;
    inQuiz?: boolean;
    multiple?: boolean;
    randomizeOptions?: boolean;
    numOptions: number;
    readonly?: boolean;
    children: React.ReactNode;
}

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

const ChoiceAnswerContext = React.createContext({
    doc: undefined,
    questionIndex: 0,
    multiple: false,
    randomizeOptions: false,
    onChange: () => {}
} as {
    doc?: ChoiceAnswerDocument;
    questionIndex: number;
    multiple?: boolean;
    randomizeOptions?: boolean;
    onChange: (optionIndex: number, checked: boolean) => void;
});

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const parentProps = React.useContext(QuizContext);
    const [meta] = React.useState(new ModelMeta(props));
    const doc = props.inQuiz ? parentProps.doc : useFirstMainDocument(props.id, meta);
    const questionIndex = props.questionIndex ?? 0;
    const randomizeOptions =
        props.randomizeOptions !== undefined ? props.randomizeOptions : parentProps.randomizeOptions;
    const isBrowser = useIsBrowser();
    const [gradingStyle, setGradingStyle] = React.useState({});

    React.useEffect(() => {
        if (randomizeOptions && !doc?.data.optionOrders?.[questionIndex]) {
            doc?.updateOptionOrders({
                ...doc.data.optionOrders,
                [questionIndex]: createRandomOrderMap(props.numOptions)
            });
        }
    }, [randomizeOptions, doc, questionIndex, props.numOptions]);

    React.useEffect(() => {
        if (!doc) {
            return;
        }

        if (props.correct === undefined) {
            // If no correct options are given, we assume that this question doesn't support grading.
            return;
        }
        const correctOptions = new Set(props.correct);

        const gradingFunction = props.grading ?? parentProps.grading;
        const grading = grade(
            doc,
            props.multiple ?? false,
            questionIndex,
            correctOptions,
            props.numOptions,
            gradingFunction
        );
        setGradingStyle({
            [styles.correct]: doc.graded && grading.result === ChoiceAnswerResult.Correct,
            [styles.partiallyCorrect]: doc.graded && grading.result === ChoiceAnswerResult.PartiallyCorrect,
            [styles.incorrect]: doc.graded && grading.result === ChoiceAnswerResult.Incorrect
        });
        doc.updateGrading(questionIndex, grading);
    }, [doc, doc?.choices, doc?.graded]);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

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

    const onOptionChange = (optionIndex: number, checked: boolean) => {
        parentProps.setFocussedQuestion?.(questionIndex);
        if (props.multiple) {
            doc?.updateMultipleChoiceSelection(questionIndex, optionIndex, checked);
        } else {
            checked
                ? doc?.updateSingleChoiceSelection(questionIndex, optionIndex)
                : doc?.resetAnswer(questionIndex);
        }
    };

    const questionOrder =
        parentProps.randomizeQuestions && parentProps.questionOrder
            ? parentProps.questionOrder[questionIndex]
            : questionIndex;

    const questionNumberToDisplay =
        (parentProps.randomizeQuestions
            ? (parentProps.questionOrder?.[questionIndex] ?? questionIndex)
            : questionIndex) + 1;
    const title =
        props.inQuiz && !parentProps.hideQuestionNumbers
            ? props.title
                ? `Frage ${questionNumberToDisplay} – ${props.title}`
                : `Frage ${questionNumberToDisplay}`
            : props.title;

    return (
        <div
            className={clsx('card', styles.choiceAnswerContainer, gradingStyle)}
            style={{ order: questionOrder }}
        >
            {title && (
                <div className={clsx('card__header', styles.header, gradingStyle)}>
                    <span className={clsx(styles.title)}>{title}</span>
                    <div className={clsx(styles.controlsAndFeedback)}>
                        {!!props.correct && (
                            <QuestionControls
                                doc={doc}
                                questionIndex={questionIndex}
                                focussedQuestion={parentProps.focussedQuestion === questionIndex}
                                inQuiz={props.inQuiz}
                            />
                        )}
                        <FeedbackBadge doc={doc} questionIndex={questionIndex} />
                        <QuestionGradingHint doc={doc} questionIndex={questionIndex} />
                    </div>
                </div>
            )}
            {!title && !!props.correct && (
                <QuestionControls
                    doc={doc}
                    questionIndex={questionIndex}
                    focussedQuestion={parentProps.focussedQuestion === questionIndex}
                    inQuiz={props.inQuiz}
                />
            )}

            <div className={clsx('card__body')}>
                {beforeBlock}
                <ChoiceAnswerContext.Provider
                    value={{
                        doc: doc,
                        questionIndex: questionIndex,
                        multiple: props.multiple,
                        randomizeOptions: randomizeOptions,
                        onChange: onOptionChange
                    }}
                >
                    <div className={styles.optionsBlock}>{optionsBlock}</div>
                </ChoiceAnswerContext.Provider>
                {afterBlock}
                {!title && <FeedbackAdmonition doc={doc} questionIndex={questionIndex} />}
            </div>
        </div>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Option = observer(({ optionIndex, children }: OptionProps) => {
    const { doc, questionIndex, multiple, randomizeOptions, onChange } =
        React.useContext(ChoiceAnswerContext);

    const optionId = React.useId();

    const isChecked = !!doc?.choices[questionIndex]?.includes(optionIndex);

    const optionOrder = React.useMemo(
        () =>
            randomizeOptions && doc?.optionOrders[questionIndex] !== undefined
                ? doc?.optionOrders[questionIndex][optionIndex]
                : optionIndex,
        [doc?.optionOrders[questionIndex], questionIndex, optionIndex]
    );

    return (
        <div
            key={optionId}
            className={clsx(styles.choiceAnswerOptionContainer)}
            style={{
                order: optionOrder
            }}
        >
            <input
                type={multiple ? 'checkbox' : 'radio'}
                id={optionId}
                name={optionId} // Use a radioGroup name here to make sure keyboard navigation still works.
                value={optionId}
                onChange={(e) => onChange(optionIndex, e.target.checked)}
                checked={isChecked}
                disabled={!doc?.canUpdateAnswer}
            />
            <label htmlFor={optionId}>{children}</label>
            {!multiple && doc?.canUpdateAnswer && isChecked && (
                <Button
                    text="Löschen"
                    color="danger"
                    icon={mdiTrashCanOutline}
                    iconSide="left"
                    size={0.7}
                    onClick={() => onChange(optionIndex, false)}
                    className={clsx(styles.btnDeleteAnswer)}
                />
            )}
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
