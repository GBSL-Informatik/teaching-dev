import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface ChoiceAnswerProps {
    id: string;
    index?: number;
    multiple?: boolean;
    readonly?: boolean;
    children: React.ReactNode;
}

interface ThinWrapperProps {
    children: React.ReactNode;
}

interface OptionProps {
    children: React.ReactNode;
    index: number;
}

type ChoiceAnswerSubComponents = {
    Before: React.FC<ThinWrapperProps>;
    Options: React.FC<ThinWrapperProps>;
    Option: React.FC<OptionProps>;
    After: React.FC<ThinWrapperProps>;
};

const ChoiceAnswerContext = React.createContext({
    id: '',
    multiple: false,
    readonly: false,
    doc: null
} as {
    id: string;
    multiple?: boolean;
    readonly?: boolean;
    doc: ChoiceAnswerDocument | null;
});

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);

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

    return (
        <div>
            {beforeBlock}
            <ChoiceAnswerContext.Provider
                value={{ id: props.id, multiple: props.multiple, readonly: props.readonly, doc }}
            >
                {optionsBlock}
            </ChoiceAnswerContext.Provider>
            {afterBlock}
        </div>
    );
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Option = ({ index, children }: OptionProps) => {
    const parentProps = React.useContext(ChoiceAnswerContext);
    const optionId = `${parentProps.id}-option-${index}`;

    return (
        <div key={optionId} className={clsx(styles.choiceAnswerOptionContainer)}>
            <input
                type={parentProps.multiple ? 'checkbox' : 'radio'}
                id={optionId}
                name={parentProps.id}
                value={optionId}
            />
            <label htmlFor={optionId}>{children}</label>
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
