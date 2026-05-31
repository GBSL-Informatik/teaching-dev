import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Card from '@tdev-components/shared/Card';
import { AssessableType, TypeModelMapping } from '@tdev-api/document';
import DocumentContext from '@tdev-components/documents/DocumentContext';
import { FeedbackBadge } from '../Feedback';
import QuestionControls from './Controls';

interface Props<T extends AssessableType> {
    doc: TypeModelMapping[T];
    children: React.ReactNode;
}

const QuestionCard = observer(<T extends AssessableType>(props: Props<T>) => {
    const { doc } = props;
    const correctAnswer = doc.linkedMeta?.correct ?? [];
    return (
        <Card
            classNames={{
                card: clsx(styles.questionCard, styles[doc.correctness]),
                header: clsx(styles.header, styles[doc.correctness])
            }}
            header={
                <>
                    <h3 className={clsx(styles.questionTitle)}>{doc.displayTitle}</h3>
                    <div className={clsx(styles.controlsAndFeedback)}>
                        {correctAnswer && (
                            <QuestionControls
                                doc={doc}
                                // focussedQuestion={parentProps.focussedQuestion === questionIndex}
                                inQuiz={!!doc.qid}
                            />
                        )}
                        <FeedbackBadge doc={doc} />
                    </div>
                </>
            }
        >
            <DocumentContext document={doc}>{props.children}</DocumentContext>
        </Card>
    );
});
export default QuestionCard;
