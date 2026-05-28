import { observer } from 'mobx-react-lite';
import React from 'react';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import { type default as ChoiceAnswerModel, ModelMeta } from '@tdev-models/documents/Assessable/ChoiceAnswer';
import Options from './Options';
import Option, { Props as OptionProps } from './Option';
import QuestionCard from '../QuestionCard';
import { action } from 'mobx';
import { useDocument } from '@tdev-hooks/useContextDocument';

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
    Option: React.FC<OptionProps<'choice_answer'>>;
};

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRootId = useDocumentRootId(props.id);

    const doc = useFirstDocumentBy(docRootId, meta, props.qid);
    const isBrowser = useIsBrowser();

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

    return (
        <QuestionCard doc={doc}>
            <DocContext.Provider value={doc}>{props.children}</DocContext.Provider>
        </QuestionCard>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Options = Options;

const onUpdateSelection = action((doc: ChoiceAnswerModel, optionIndex: number, checked: boolean) => {
    doc.updateSelection(optionIndex, checked, doc.multiple);
});
ChoiceAnswer.Option = observer((props: Omit<OptionProps<'choice_answer'>, 'onChange'>) => {
    const doc = useDocument<'choice_answer'>();
    return (
        <Option
            {...props}
            onChange={onUpdateSelection}
            optionOrder={doc.optionsDisplayOrder(props.optionIndex)}
            isChecked={doc.choices.has(props.optionIndex)}
            multiple={doc.multiple}
        />
    );
});

export default ChoiceAnswer;
