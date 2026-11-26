import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { isStatementTrue, withStatementTrue } from '../../../assessable/trueFalseAnswer';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/**
 * The correct answer of `<TrueFalseAnswer>`: exactly one of both is correct.
 * Answers not written as boolean literals are edited in the tag.
 */
const TrueFalseChoice = observer(({ handle }: NodeViewProps) => {
    // groups the radio buttons of this answer, the document may have several
    const radioGroup = React.useId();
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const isTrue = isStatementTrue(attributes);
    if (isTrue === null) {
        return null;
    }

    const handleChange = (statementTrue: boolean) => {
        handle.updateAttrs({ attributes: withStatementTrue(attributes, statementTrue) });
    };

    return (
        <span className={clsx(styles.group)} title="Die richtige Antwort">
            <label>
                <input type="radio" name={radioGroup} checked={isTrue} onChange={() => handleChange(true)} />
                Richtig
            </label>
            <label>
                <input
                    type="radio"
                    name={radioGroup}
                    checked={!isTrue}
                    onChange={() => handleChange(false)}
                />
                Falsch
            </label>
        </span>
    );
});

export default TrueFalseChoice;
