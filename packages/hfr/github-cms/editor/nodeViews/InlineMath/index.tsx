import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import katex from 'katex';
import { observer } from 'mobx-react-lite';
import React from 'react';
import InlinePopover from '../../components/InlinePopover';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

export const renderMath = (value: string, displayMode: boolean) => {
    return katex.renderToString(value, { throwOnError: false, displayMode });
};

/**
 * `$\LaTeX$`, rendered with KaTeX and edited in a popover.
 */
const InlineMath = observer(({ handle }: NodeViewProps) => {
    const { value } = handle.node.attrs;
    const html = React.useMemo(() => renderMath(value, false), [value]);
    return (
        <InlinePopover
            title="Mathematik"
            trigger={
                <span
                    className={clsx(styles.math, handle.selected && styles.selected)}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            }
        >
            <TextInput
                value={value}
                className={clsx(styles.input)}
                onChange={(value) => handle.updateAttrs({ value })}
                noSpellCheck
            />
        </InlinePopover>
    );
});

export default InlineMath;
