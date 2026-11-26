import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { HINT_CONDITIONS, hintConditions, withHintConditions } from '../../../assessable/hint';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/**
 * The conditions (`when`) under which a `<Hint>` is shown, toggled as chips.
 * Functions and the `not` attribute are edited in the tag.
 */
const HintConditions = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const conditions = hintConditions(attributes);
    if (!conditions) {
        return null;
    }

    const handleToggle = (condition: string) => {
        const isActive = conditions.includes(condition);
        // without a condition, the hint is never shown
        if (isActive && conditions.length === 1) {
            return;
        }
        const updated = isActive ? conditions.filter((c) => c !== condition) : [...conditions, condition];
        handle.updateAttrs({ attributes: withHintConditions(attributes, updated) });
    };

    return (
        // the chips handle their clicks themselves, ProseMirror must not select the node
        <div className={clsx(styles.conditions)} data-stop-event title="Anzeigen, wenn die Antwort … ist">
            {HINT_CONDITIONS.map(({ value, label, color }) => (
                <button
                    key={value}
                    type="button"
                    className={clsx(
                        'badge',
                        conditions.includes(value) ? `badge--${color}` : styles.inactive
                    )}
                    onClick={() => handleToggle(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
});

export default HintConditions;
