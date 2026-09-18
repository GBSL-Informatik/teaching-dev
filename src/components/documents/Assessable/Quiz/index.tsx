import { observer } from 'mobx-react-lite';
import React from 'react';
import LoginRequiredForDocumentType from '@tdev-components/shared/Alert/LoginRequiredForDocumentType';
import styles from './styles.module.scss';
import { DocumentRootIdContext } from '@tdev-hooks/useContextDocumentRootId';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import { ModelMeta } from '@tdev-models/documents/Assessable/Quiz';
import useLinkedMetaModel from '@tdev-hooks/useLinkedMetaModel';
import { AssessableType } from '@tdev-api/document';
import QuizControls from './QuizControls';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { QuizScore } from '../Feedback/QuizScore';
import clsx from 'clsx';
import { useScrollTo } from '@tdev-hooks/useScrollTo';

export interface Props extends AssessableComponentProps<AssessableType> {
    id: string;
    qid: never;
    questionIds: string[];
    hideQuestionNumbers?: boolean;
    randomizeOptions?: boolean;
    randomizeQuestions?: boolean;
    resetMode: 'all' | 'incorrect' | 'noReset';
    minPoints?: number;
    allowSelection?: boolean;
    shuffleOnReset?: boolean;
}

const Quiz = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);
    const doc = useFirstRealMainDocument(props.id, meta);
    const [ref, animate] = useScrollTo(doc, 'end');
    useLinkedMetaModel(doc, meta);

    if (!doc) {
        return <LoginRequiredForDocumentType type={meta.type} />;
    }

    return (
        <div
            className={clsx(
                styles.quiz,
                animate && styles.animate,
                props.allowSelection && styles.allowSelection,
                doc.isAssessed && doc.assessment && styles[doc.assessment?.correctness]
            )}
            ref={ref}
        >
            <DocumentRootIdContext id={props.id}>
                <div className={styles.content}>{props.children}</div>
                <div className={styles.footer}>
                    <QuizScore doc={doc} />
                    <QuizControls
                        doc={doc}
                        resetMode={props.resetMode ?? 'all'}
                        shuffleOnReset={props.shuffleOnReset}
                    />
                </div>
            </DocumentRootIdContext>
        </div>
    );
});

export default Quiz;
