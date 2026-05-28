import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Card from '@tdev-components/shared/Card';
import iAssessable from '@tdev-models/documents/Assessable/iAssessable';
import { AssessableType, TypeModelMapping } from '@tdev-api/document';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import DocumentContext from '@tdev-components/documents/DocumentContext';
import { AssessableTypeModelMapping } from '@tdev-api/document';
import { FeedbackBadge } from '../Feedback';
import QuestionControls from '../Controls';

interface Props<T extends AssessableType> {
    title: string | React.ReactNode;
    doc: TypeModelMapping[T];
    children: React.ReactNode;
}

const QuestionCard = observer(<T extends AssessableType>(props: Props<T>) => {
    const { doc, title } = props;
    const correctAnswer = doc.linkedMeta?.correct ?? [];
    return (
        <Card
            classNames={{
                card: clsx(styles.questionCard, styles[doc.correctness]),
                header: clsx(styles.header, styles[doc.correctness])
            }}
            header={
                <>
                    <h3 className={clsx(styles.questionTitle)}>
                        {title}
                        {JSON.stringify(correctAnswer)}
                        <CopyBadge value={doc.id} label={doc.id.slice(0, 7)} />
                    </h3>
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
