import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import NodeToolbar from '../../components/NodeToolbar';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const CodeBlockHeader = observer(({ handle }: NodeViewProps) => {
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

export default CodeBlockHeader;
