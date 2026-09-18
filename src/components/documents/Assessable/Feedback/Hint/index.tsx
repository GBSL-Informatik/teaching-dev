import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import type { AssessableType, TypeModelMapping } from '@tdev-api/document';
import { Correctness } from '@tdev-models/documents/Assessable/iAssessable';
import Alert, { type AlertType } from '@tdev-components/shared/Alert';

type When = Correctness | 'assessed' | 'unassessed';
type WhenFunction<T extends AssessableType> = (
    doc: TypeModelMapping[T]
) => { show: boolean; color: AlertType; children?: React.ReactNode; className?: string } | null;

interface Props<T extends AssessableType = AssessableType> {
    when: When | When[] | WhenFunction<T>;
    not?: When | When[];
    noWrap?: boolean;
    color?: AlertType;
    children?: React.ReactNode;
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

const AlertHint = observer((props: Omit<Props, 'when'> & { when?: When }) => {
    if (props.noWrap) {
        return <>{props.children}</>;
    }

    return (
        <Alert
            type={props.color ?? (props.when ? ColorMapping[props.when] : undefined)}
            className={props.className}
        >
            {props.children}
        </Alert>
    );
});

const Hint = observer(<T extends AssessableType>(props: Props<T>) => {
    const doc = useDocument<T>();
    const whenFn = typeof props.when === 'function' ? props.when : null;
    if (whenFn) {
        const res = whenFn(doc);
        if (!res || !res.show) {
            return null;
        }
        return (
            <AlertHint
                {...props}
                when={Correctness.NA}
                color={res.color}
                children={res.children ?? props.children}
                className={res.className ?? props.className}
            />
        );
    }
    const when = Array.isArray(props.when) ? new Set(props.when) : new Set([props.when]);
    const not = Array.isArray(props.not) ? new Set(props.not) : new Set(props.not ? [props.not] : []);
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
