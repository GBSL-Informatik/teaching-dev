import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import NodeToolbar from '../../components/NodeToolbar';
import { renderMath } from '../InlineMath';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

export const CodeBlockHeader = observer(({ handle }: NodeViewProps) => {
    const { lang, meta } = handle.node.attrs;
    return (
        <NodeToolbar handle={handle} title="```" className={clsx(styles.header)}>
            <TextInput
                value={lang}
                placeholder="Sprache"
                noAutoFocus
                noSpellCheck
                className={clsx(styles.lang)}
                onChange={(lang) => handle.updateAttrs({ lang })}
            />
            <TextInput
                value={meta}
                placeholder="Meta, z.B. live_py title=..."
                noAutoFocus
                noSpellCheck
                className={clsx(styles.meta)}
                onChange={(meta) => handle.updateAttrs({ meta })}
            />
        </NodeToolbar>
    );
});

export const MathBlockHeader = observer(({ handle }: NodeViewProps) => {
    return <NodeToolbar handle={handle} title="$$ Mathematik" className={clsx(styles.header)} />;
});

export const MathBlockPreview = observer(({ handle }: NodeViewProps) => {
    const value = handle.node.textContent;
    const html = React.useMemo(() => renderMath(value, true), [value]);
    return <div className={clsx(styles.preview)} dangerouslySetInnerHTML={{ __html: html }} />;
});

export const FrontmatterHeader = observer(({ handle }: NodeViewProps) => {
    return <NodeToolbar handle={handle} title="--- Frontmatter" className={clsx(styles.header)} />;
});

const RAW_BLOCK_TITLES: Record<string, string> = {
    mdxjsEsm: 'MDX import/export',
    mdxFlowExpression: 'MDX {Ausdruck}',
    html: 'HTML',
    definition: 'Link-Definition'
};

export const RawBlockHeader = observer(({ handle }: NodeViewProps) => {
    const { kind } = handle.node.attrs;
    return (
        <NodeToolbar handle={handle} title={RAW_BLOCK_TITLES[kind] ?? kind} className={clsx(styles.header)} />
    );
});
