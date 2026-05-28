import { observer } from 'mobx-react-lite';
import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import useIsBrowser from '@docusaurus/useIsBrowser';
import QuestionControls from '../Controls';
import { FeedbackBadge } from '../Feedback';
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import { DocumentModelType } from '@tdev-api/document';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import { ModelMeta } from '@tdev-models/documents/Assessable/ChoiceAnswer';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import Options from './Options';
import Option, { type Props as OptionProps } from './Option';
import QuestionCard from '../QuestionCard';

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

type ChoiceAnswerSubComponents = {
    Options: React.FC<ThinWrapperProps>;
    Option: React.FC<OptionProps>;
};

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRootId = useDocumentRootId(props.id);

    const doc = useFirstDocumentBy(docRootId, meta, props.qid);
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
    const questionNumberToDisplay = 1; // TODO: get question number from quiz context when available
    const inQuiz = !!props.qid;
    // TODO: update when ModelMeta for Quiz is implemented
    const canonicalTitle =
        inQuiz && !(doc.root?.meta as { hideQuestionNumbers?: boolean })?.hideQuestionNumbers
            ? props.title
                ? `Frage ${questionNumberToDisplay} – ${props.title}`
                : `Frage ${questionNumberToDisplay}`
            : props.title;
    const displayTitle = canonicalTitle || 'Frage';

    return (
        <QuestionCard title={displayTitle} doc={doc}>
            <DocContext.Provider value={doc}>{props.children}</DocContext.Provider>
        </QuestionCard>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Options = Options;
ChoiceAnswer.Option = Option;

export default ChoiceAnswer;
