import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
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
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useDummyId } from '@tdev-hooks/useDummyId';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import { DocumentModelType } from '@tdev-api/document';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { AssessableComponentProps } from '@tdev-models/documents/Quiz/AssessableMeta';
import { ModelMeta } from '@tdev-models/documents/Quiz/ChoiceAnswer';
import CopyBadge from '@tdev-components/shared/CopyBadge';

interface SharedProps extends AssessableComponentProps<'choice_answer'> {
    multiple?: boolean;
    randomizeOptions?: boolean;
    optionsCount: number;
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
    // // when inside a quizz, this will share the document root with the quiz
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
    React.useEffect(() => {
        if (!doc) {
            return;
        }
        doc.setLinkedMeta(meta);
    }, [doc, meta]);
    const isBrowser = useIsBrowser();

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }
    const questionNumberToDisplay = 1;
    const inQuiz = !!props.qid;
    // TODO: update when ModelMeta for Quiz is implemented
    const canonicalTitle =
        inQuiz && !(doc.root?.meta as { hideQuestionNumbers?: boolean }).hideQuestionNumbers
            ? props.title
                ? `Frage ${questionNumberToDisplay} – ${props.title}`
                : `Frage ${questionNumberToDisplay}`
            : props.title;
    const displayTitle = canonicalTitle || 'Frage';

    return (
        <div
            className={clsx('card', styles.choiceAnswerContainer, styles[doc.correctness] /*feedbackStyle*/)}
            // style={{ order: questionOrder }}
            // tabIndex={questionOrder}
        >
            <div className={clsx('card__header', styles.header, styles[doc.correctness] /*feedbackStyle*/)}>
                <span className={clsx(styles.title)}>
                    {displayTitle}
                    {JSON.stringify(props.correct)}
                    <CopyBadge value={doc.id} label={doc.id.slice(0, 7)} />
                </span>
                <div className={clsx(styles.controlsAndFeedback)}>
                    {!!props.correct && (
                        <QuestionControls
                            doc={doc}
                            // focussedQuestion={parentProps.focussedQuestion === questionIndex}
                            inQuiz={!!props.qid}
                        />
                    )}
                    <FeedbackBadge doc={doc} />
                </div>
            </div>

            <div className={clsx('card__body')}>
                <DocContext.Provider value={doc}>{props.children}</DocContext.Provider>
            </div>
        </div>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Option = observer(({ optionIndex, children }: OptionProps) => {
    const doc = useDocument<'choice_answer'>();
    const optionId = React.useId();
    const isChecked = doc.choices.has(optionIndex);

    const optionOrder = doc.optionsDisplayOrder(optionIndex);
    return (
        <div
            key={optionId}
            className={clsx(styles.choiceAnswerOptionContainer)}
            style={{
                order: optionOrder
            }}
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
                    tabIndex={optionOrder}
                />
            </div>
            <label htmlFor={optionId}>{children}</label>
            {!doc.multiple && (
                <div className={styles.btnDeleteAnswerContainer}>
                    <Button
                        color="danger"
                        icon={mdiTrashCanOutline}
                        iconSide="left"
                        size={0.7}
                        onClick={() => doc.updateSelection(optionIndex, false)}
                        className={clsx(styles.btnDeleteAnswer, {
                            [styles.visible]: doc?.canUpdateAnswer && isChecked
                        })}
                    />
                </div>
            )}
        </div>
    );
});

ChoiceAnswer.Before = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.Options = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={clsx(styles.optionsBlock)}>
            <div className={styles.optionsContainer}>{children}</div>
        </div>
    );
};
ChoiceAnswer.After = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default ChoiceAnswer;
