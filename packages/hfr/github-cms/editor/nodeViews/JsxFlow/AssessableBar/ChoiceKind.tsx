import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { flagValue, withFlag } from '../../../assessable/attributeOptions';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/** single or multiple choice, the `multiple` flag of `<ChoiceAnswer>`, an expression is edited in the tag */
const ChoiceKind = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const isMultiple = flagValue(attributes, 'multiple');
    if (isMultiple === null) {
        return null;
    }

    const handleChange = (multiple: boolean) => {
        handle.updateAttrs({ attributes: withFlag(attributes, 'multiple', multiple) });
    };

    return (
        <select
            className={clsx(styles.input)}
            value={isMultiple ? 'multiple' : 'single'}
            title="Wie viele Antworten ausgewählt werden können"
            onChange={(event) => handleChange(event.target.value === 'multiple')}
        >
            <option value="single">Single-Choice</option>
            <option value="multiple">Multiple-Choice</option>
        </select>
    );
});

export default ChoiceKind;
