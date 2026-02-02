import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import SyncStatus from '@tdev-components/SyncStatus';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { QuizContext } from './Quiz';
import Button from '@tdev-components/shared/Button';
import { mdiCloseCircleOutline, mdiRestore, mdiTrashCanOutline } from '@mdi/js';

export interface ChoiceAnswerProps {
    id: string;
    questionIndex?: number;
    inQuiz?: boolean;
    multiple?: boolean;
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
    id: '',
    questionIndex: 0,
    multiple: false,
    readonly: false,
    selectedChoices: [],
    onChange: () => {}
} as {
    id: string;
    questionIndex: number;
    multiple?: boolean;
    readonly?: boolean;
    selectedChoices: number[];
    onChange: (optionIndex: number, checked: boolean) => void;
});

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const parentProps = React.useContext(QuizContext);
    const [meta] = React.useState(new ModelMeta(props));
    const id = parentProps.id || props.id;
    const doc = props.inQuiz ? parentProps.doc : useFirstMainDocument(id, meta);
    const questionIndex = props.questionIndex ?? 0;
    const isBrowser = useIsBrowser();

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

    return (
        <div className={styles.choiceAnswerContainer}>
            {parentProps.focussedQuestion === questionIndex && (
                <SyncStatus className={styles.syncStatus} model={doc} size={0.7} />
            )}

            {props.inQuiz && !parentProps.hideQuestionNumbers && <h3>Frage {questionIndex + 1}</h3>}
            {beforeBlock}
            <ChoiceAnswerContext.Provider
                value={{
                    id: id,
                    questionIndex: questionIndex,
                    multiple: props.multiple,
                    readonly: props.readonly || parentProps.readonly || !doc || doc.isDummy,
                    selectedChoices: doc?.data.choices[questionIndex] || [],
                    onChange: onOptionChange
                }}
            >
                {optionsBlock}
            </ChoiceAnswerContext.Provider>
            {afterBlock}
        </div>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Option = ({ optionIndex, children }: OptionProps) => {
    const parentProps = React.useContext(ChoiceAnswerContext);
    const optionId = `${parentProps.id}-q${parentProps.questionIndex}-opt${optionIndex}`;

    return (
        <div key={optionId} className={clsx(styles.choiceAnswerOptionContainer)}>
            <input
                type={parentProps.multiple ? 'checkbox' : 'radio'}
                id={optionId}
                name={optionId}
                value={optionId}
                onChange={(e) => parentProps.onChange(optionIndex, e.target.checked)}
                checked={parentProps.selectedChoices.includes(optionIndex)}
                disabled={parentProps.readonly}
            />
            <label htmlFor={optionId}>{children}</label>
            {!parentProps.multiple &&
                !parentProps.readonly &&
                parentProps.selectedChoices.includes(optionIndex) && (
                    <Button
                        text="Antwort löschen"
                        color="danger"
                        icon={mdiTrashCanOutline}
                        iconSide="left"
                        size={0.7}
                        onClick={() => parentProps.onChange(optionIndex, false)}
                        className={clsx(styles.btnDeleteAnswer)}
                    />
                )}
        </div>
    );
};

ChoiceAnswer.Before = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.Options = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.After = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default ChoiceAnswer;
