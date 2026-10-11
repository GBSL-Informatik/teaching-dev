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
    const isDummy = doc.isDummy || isDummyId(doc.id);
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
                        {correctAnswer && <QuestionControls doc={doc} />}
                        <QuestionScore doc={doc} />
                        {isDummy && (
                            <Icon
                                path={mdiAlert}
                                color="var(--ifm-color-warning)"
                                size={SIZE_S}
                                title="Diese Frage wurde nicht von der Datenbank geladen und kann nicht gespeichert werden."
                                className={clsx(styles.dummyIcon)}
                            />
                        )}
                    </div>
                </>
            }
        >
            <DocumentContext document={doc}>{props.children}</DocumentContext>
        </Card>
    );
});
export default QuestionCard;
