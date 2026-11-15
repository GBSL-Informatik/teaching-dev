import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

/**
 * `[^label]`, a reference to a footnote definition.
 */
const FootnoteReference = observer(({ handle }: NodeViewProps) => {
    return (
        <sup className={clsx(styles.reference, handle.selected && styles.selected)}>
            [^{handle.node.attrs.label}]
        </sup>
    );
});

export default FootnoteReference;
