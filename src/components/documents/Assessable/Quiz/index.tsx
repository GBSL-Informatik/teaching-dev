import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { observer } from 'mobx-react-lite';
import React from 'react';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import styles from './styles.module.scss';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { DocumentRootIdContext } from '@tdev-hooks/useContextDocumentRootId';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import { ModelMeta } from '@tdev-models/documents/Assessable/Quiz';
import useLinkedMetaModel from '@tdev-hooks/useLinkedMetaModel';
import { AssessableType } from '@tdev-api/document';
import QuizControls from './QuizControls';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { QuizScore } from '../Feedback/QuizScore';

export interface Props extends AssessableComponentProps<AssessableType> {
    id: string;
    qid: never;
    questionIds: string[];
    hideQuestionNumbers?: boolean;
    randomizeOptions?: boolean;
    randomizeQuestions?: boolean;
    minPoints?: number;
}

const Quiz = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstRealMainDocument(props.id, meta);
    const isBrowser = useIsBrowser();
    useLinkedMetaModel(doc, meta);

    // const [focussedQuestion, setFocussedQuestion] = React.useState(0);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

    return (
        <DocumentRootIdContext id={props.id}>
            <div className={styles.content}>{props.children}</div>
            <div className={styles.footer}>
                <QuizScore doc={doc} />
                <QuizControls doc={doc} />
            </div>
        </DocumentRootIdContext>
    );
});

export default Quiz;
