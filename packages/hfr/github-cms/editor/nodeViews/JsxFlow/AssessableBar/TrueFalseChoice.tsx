import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { isStatementTrue, withStatementTrue } from '../../../assessable/trueFalseAnswer';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/**
 * The correct answer of `<TrueFalseAnswer>`, ticked like the options of a choice answer.
 * Answers not written as boolean literals are edited in the tag.
 */
const TrueFalseChoice = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const isTrue = isStatementTrue(attributes);
    if (isTrue === null) {
        return null;
    }

    const handleChange = (statementTrue: boolean) => {
        if (statementTrue === isTrue) {
            return;
        }
        handle.updateAttrs({ attributes: withStatementTrue(attributes, statementTrue) });
    };

    return (
        <span className={clsx(styles.group)} title="Die richtige Antwort">
            <label>
                <input type="checkbox" checked={isTrue} onChange={() => handleChange(true)} />
                Richtig
            </label>
            <label>
                <input type="checkbox" checked={!isTrue} onChange={() => handleChange(false)} />
                Falsch
            </label>
        </span>
    );
});

export default TrueFalseChoice;
