import { mdiAlert } from '@mdi/js';
import Icon from '@mdi/react';
import { AssessableType, TypeModelMapping } from '@tdev-api/document';
import DocumentContext from '@tdev-components/documents/DocumentContext';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { isDummyId } from '@tdev-hooks/useDummyId';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { QuestionScore } from '../Feedback/QuestionScore';
import QuestionControls from './Controls';
import styles from './styles.module.scss';

interface Props<T extends AssessableType> {
    doc: TypeModelMapping[T];
    allowSelection?: boolean;
    children: React.ReactNode;
}

const QuestionCard = observer(<T extends AssessableType>(props: Props<T>) => {
    const { doc } = props;
    const correctAnswer = doc.linkedMeta?.correct ?? [];
    return (
        <Card
            classNames={{
                card: clsx(
                    styles.questionCard,
                    styles[doc.correctness],
                    props.allowSelection && styles.allowSelection
                ),
                header: clsx(styles.header, styles[doc.correctness])
            }}
            style={{
                order: doc.questionIndex
            }}
            header={
                <>
                    <h3 className={clsx(styles.questionTitle)}>{doc.displayTitle}</h3>
                    <div className={clsx(styles.controlsAndFeedback)}>
                        {isDummyId(doc.id) ? (
                            <Icon path={mdiAlert} size={SIZE_S} color="var(--ifm-color-warning)" />
                        ) : null}
                        {correctAnswer && <QuestionControls doc={doc} />}
                        <QuestionScore doc={doc} />
                    </div>
                </>
            }
        >
            <DocumentContext document={doc}>{props.children}</DocumentContext>
        </Card>
    );
});
export default QuestionCard;
