import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { findAttribute, withAttribute } from '../../../jsxAttributes';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/** single or multiple choice, the `multiple` flag of `<ChoiceAnswer>` */
const ChoiceKind = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const isMultiple = !!findAttribute(attributes, 'multiple');

    const handleChange = (multiple: boolean) => {
        const flag: JsxAttribute | null = multiple
            ? { type: 'attribute', name: 'multiple', value: null }
            : null;
        handle.updateAttrs({ attributes: withAttribute(attributes, 'multiple', flag) });
    };

    return (
        <span className={clsx(styles.group)}>
            <select
                value={isMultiple ? 'multiple' : 'single'}
                title="Wie viele Antworten ausgewählt werden können"
                onChange={(event) => handleChange(event.target.value === 'multiple')}
            >
                <option value="single">Single-Choice</option>
                <option value="multiple">Multiple-Choice</option>
            </select>
        </span>
    );
});

export default ChoiceKind;
