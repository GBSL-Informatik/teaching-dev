import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { AssessableType } from '@tdev-api/document';
import { Correctness } from '@tdev-models/documents/Assessable/iAssessable';
import Alert, { type AlertType } from '@tdev-components/shared/Alert';

type When = Correctness | 'assessed' | 'unassessed';

interface Props {
    children?: React.ReactNode;
    when: When | When[];
    not: When | When[];
    noWrap?: boolean;
    color?: AlertType;
    className?: string;
}

const ColorMapping: { [key in When]: AlertType } = {
    [Correctness.Correct]: 'success',
    [Correctness.Incorrect]: 'danger',
    [Correctness.PartiallyCorrect]: 'warning',
    [Correctness.NA]: 'secondary',
    assessed: 'info',
    unassessed: 'info'
};

const AlertHint = observer((props: Omit<Props, 'when'> & { when: When }) => {
    if (props.noWrap) {
        return <>{props.children}</>;
    }

    return (
        <Alert type={props.color ?? ColorMapping[props.when]} className={props.className}>
            {props.children}
        </Alert>
    );
});

const Hint = observer(<T extends AssessableType>(props: Props) => {
    const doc = useDocument<T>();
    const when = Array.isArray(props.when) ? new Set(props.when) : new Set([props.when]);
    const not = Array.isArray(props.not) ? new Set(props.not) : new Set([props.not]);
    if (!doc.isAssessed) {
        if (when.has('unassessed')) {
            return <AlertHint {...props} when="unassessed" />;
        }
        return null;
    }
    if (!when.has(doc.correctness) && !when.has('assessed')) {
        return null;
    }
    if (not.has(doc.correctness) || not.has('assessed')) {
        return null;
    }
    const whenType = when.has(doc.correctness) ? doc.correctness : 'assessed';
    return <AlertHint {...props} when={whenType} />;
});

export default Hint;
