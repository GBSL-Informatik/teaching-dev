import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import InlinePopover from '../../components/InlinePopover';
import { schema } from '../../schema';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

/**
 * Inline nodes without a visual representation: raw mdx (e.g. `<Foo />`, `{expression}`)
 * and footnote references.
 */
const InlineAtom = observer(({ handle }: NodeViewProps) => {
    const { node } = handle;
    if (node.type === schema.nodes.footnote_reference) {
        return <sup className={clsx(styles.atom)}>[^{node.attrs.label}]</sup>;
    }
    return (
        <InlinePopover
            onClose={() => handle.selectAndFocus()}
            title="MDX"
            trigger={
                <code className={clsx(styles.atom, handle.selected && styles.selected)}>
                    {node.attrs.value}
                </code>
            }
        >
            <TextAreaInput
                defaultValue={node.attrs.value}
                monospace
                onChange={(value) => handle.updateAttrs({ value })}
            />
        </InlinePopover>
    );
});

export default InlineAtom;
